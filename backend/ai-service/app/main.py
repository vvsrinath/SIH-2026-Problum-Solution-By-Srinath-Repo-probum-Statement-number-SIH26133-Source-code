"""FastAPI application exposing the Swasthya Sathi AI Assistant.

Uses a local rule-based engine (no external LLM dependency).

Run with:
    uvicorn app.main:app --reload --port 8100
"""
from __future__ import annotations

import json
from typing import Iterator

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

from . import config
from .engine import generate_response, generate_triage_assessment
from .languages import LANGUAGES, language_name, normalize_lang_code
from .memory import store
from .rule_engine import assess_symptoms, get_followup_questions, get_symptom_vocabulary
from .schemas import (
    ChatRequest,
    ChatResponse,
    HealthResponse,
    RuleTriageRequest,
    RuleTriageResponse,
    SessionInfo,
    SessionsResponse,
    TranslateRequest,
    TranslateResponse,
)
from .security import detect_emergency, emergency_reply

# Optional ML engine (falls back to keyword matching if not available)
try:
    from .ml_engine import classify_symptom_category, get_model_info
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False

app = FastAPI(
    title="Swasthya Sathi AI Assistant API",
    description="Local rule-based health assistant — no external LLM required.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS or ["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def require_internal_secret(
    x_ai_service_secret: str | None = Header(default=None),
):
    """Guard internal API endpoints with a shared secret when one is configured."""
    if not config.AI_SERVICE_SECRET:
        return True
    import hmac

    if not x_ai_service_secret or not hmac.compare_digest(
        x_ai_service_secret, config.AI_SERVICE_SECRET
    ):
        raise HTTPException(status_code=401, detail="Invalid AI service secret")
    return True


def _resolve_lang(request_lang: str, message: str) -> str:
    """Use an explicit code, else default to English."""
    if request_lang and request_lang.lower() not in ("auto", ""):
        code = normalize_lang_code(request_lang)
        if code in LANGUAGES:
            return code
    return "en"


def _is_triage_request(message: str) -> bool:
    """Detect the structured triage prompt sent by the Node backend.

    The triage prompt asks for an exact JSON only, so route it to the
    deterministic assessment function instead of the conversational engine.
    """
    return (
        "possibleConditions" in message
        and "riskLevel" in message
        and "recommendedAction" in message
    )


@app.get("/", include_in_schema=False)
def root():
    return {"app": "Swasthya Sathi AI Assistant API", "docs": "/docs", "health": "/api/v1/health"}


@app.get("/api/v1/health", response_model=HealthResponse)
def health():
    model_info = get_model_info() if ML_AVAILABLE else {"model_loaded": False, "model_type": "keyword-only"}
    return HealthResponse(
        status="ok",
        model="rule-based-v2.0",
        backend="local",
        message=f"Local engine active. ML model: {model_info.get('model_type', 'unavailable')}.",
    )


@app.get("/api/v1/model/info")
def model_info():
    """Return information about the ML model status."""
    if ML_AVAILABLE:
        return get_model_info()
    return {"model_loaded": False, "model_type": "unavailable", "categories": [], "supported_languages": ["en"]}


@app.post("/api/v1/triage/assess-rule", response_model=RuleTriageResponse)
def triage_assess_rule(req: RuleTriageRequest):
    """Rule-based symptom assessment — fully local and deterministic.

    Evaluates symptom text against a JSON rule set. No external LLM involved.
    Patient-facing endpoint; guards are handled upstream by the Node API.
    """
    return RuleTriageResponse(**assess_symptoms(
        symptoms_text=req.symptoms,
        duration=req.duration,
        age_group=req.age_group,
        context=req.context or {},
    ))


@app.get("/api/v1/triage/symptoms")
def triage_symptoms_vocabulary():
    """Return the symptom vocabulary for building the patient checkbox UI."""
    vocab = get_symptom_vocabulary()
    return {
        "version": vocab.get("version", "1.0.0"),
        "categories": {
            key: {
                "label": cat["label"],
                "symptoms": [
                    {"id": s["id"], "label": s["label"]}
                    for s in cat["symptoms"]
                ],
            }
            for key, cat in vocab.get("categories", {}).items()
        },
    }


@app.get("/api/v1/triage/followups")
def triage_followups(symptom_ids: str = ""):
    """Return relevant follow-up questions for the given symptom IDs."""
    ids = [i for i in symptom_ids.split(",") if i.strip()]
    questions = get_followup_questions(ids)
    return {"questions": questions}


@app.post("/api/v1/chat", response_model=ChatResponse, dependencies=[Depends(require_internal_secret)])
def chat(req: ChatRequest):
    emergency = detect_emergency(req.message)
    if emergency:
        sid = store.get_or_create(req.session_id)
        return ChatResponse(
            session_id=sid,
            agent="Safety",
            reply=emergency_reply(),
            emergency=True,
            lang="en",
        )

    lang = _resolve_lang(req.lang, req.message)
    sid = store.get_or_create(req.session_id)

    if _is_triage_request(req.message):
        reply = generate_triage_assessment(req.message)
        agent = "Symptom Triage"
    else:
        reply, agent = generate_response(req.message, lang)

    store.append_user(sid, req.message)
    store.append_assistant(sid, reply)
    return ChatResponse(session_id=sid, agent=agent, reply=reply, emergency=False, lang=lang)


@app.post("/api/v1/chat/stream", dependencies=[Depends(require_internal_secret)])
def chat_stream(req: ChatRequest):
    emergency = detect_emergency(req.message)
    if emergency:
        sid = store.get_or_create(req.session_id)
        return StreamingResponse(
            _emergency_stream(sid),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )
    return StreamingResponse(
        _stream_response(req),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


def _emergency_stream(sid: str) -> Iterator[str]:
    yield _sse("meta", {"session_id": sid, "agent": "Safety", "lang": "en", "emergency": True})
    yield _sse("delta", {"text": emergency_reply()})
    yield _sse("done", {"session_id": sid})


def _stream_response(req: ChatRequest) -> Iterator[str]:
    lang = _resolve_lang(req.lang, req.message)
    sid = store.get_or_create(req.session_id)

    reply, agent = generate_response(req.message, lang)

    yield _sse("meta", {"session_id": sid, "agent": agent, "lang": lang, "emergency": False})

    # Stream word-by-word for a natural feel
    words = reply.split(" ")
    chunk = ""
    for word in words:
        chunk += word + " "
        if len(chunk) > 30 or word.endswith(("\n", ".", "!", "?")):
            yield _sse("delta", {"text": chunk.strip() + " "})
            chunk = ""
    if chunk.strip():
        yield _sse("delta", {"text": chunk.strip()})

    store.append_user(sid, req.message)
    store.append_assistant(sid, reply)
    yield _sse("done", {"session_id": sid, "agent": agent})


# Simple offline translation dictionary for common medical terms
_SIMPLE_TRANSLATIONS: dict[str, dict[str, str]] = {
    "fever": {"hi": "बुखार", "ta": "காய்ச்சல்", "te": "జ్వరం", "bn": "জ্বর"},
    "cough": {"hi": "खांसी", "ta": "இருமல்", "te": "దగ్గు", "bn": "কাশি"},
    "headache": {"hi": "सिरदर्द", "ta": "தலைவலி", "te": "తలనొప్పి", "bn": "মাথাব্যথা"},
    "pain": {"hi": "दर्द", "ta": "வலி", "te": "నొప్పి", "bn": "ব্যথা"},
    "medicine": {"hi": "दवा", "ta": "மருந்து", "te": "మందు", "bn": "ওষুধ"},
    "doctor": {"hi": "डॉक्टर", "ta": "மருத்துவர்", "te": "డాక్టర్", "bn": "ডাক্তার"},
    "hospital": {"hi": "अस्पताल", "ta": "மருத்துவமனை", "te": "ఆసుపత్రి", "bn": "হাসপাতাল"},
    "appointment": {"hi": "अपॉइंटमेंट", "ta": "நியமனம்", "te": " అపాయింట్‌మెంట్", "bn": "অ্যাপয়েন্টমেন্ট"},
    "help": {"hi": "मदद", "ta": "உதவி", "te": "సహాయం", "bn": "সাহায্য"},
    "hello": {"hi": "नमस्ते", "ta": "வணக்கம்", "te": "నమస్తే", "bn": "নমস্কার"},
}


@app.post("/api/v1/translate", response_model=TranslateResponse, dependencies=[Depends(require_internal_secret)])
def translate(req: TranslateRequest):
    to = normalize_lang_code(req.to)
    text_lower = req.text.strip().lower()

    # Try simple dictionary lookup for single words
    if text_lower in _SIMPLE_TRANSLATIONS and to in _SIMPLE_TRANSLATIONS[text_lower]:
        translated = _SIMPLE_TRANSLATIONS[text_lower][to]
        return TranslateResponse(text=translated, from_lang=req.source or "auto", to_lang=to)

    # Fallback: return original text with a note
    return TranslateResponse(
        text=f"[Translation to {language_name(to)} — full translation service coming soon] {req.text}",
        from_lang=req.source or "auto",
        to_lang=to,
    )


@app.get("/api/v1/sessions", response_model=SessionsResponse, dependencies=[Depends(require_internal_secret)])
def list_sessions():
    return SessionsResponse(
        sessions=[SessionInfo(id=s["id"], message_count=s["message_count"]) for s in store.list_sessions()]
    )


@app.delete("/api/v1/sessions/{session_id}", dependencies=[Depends(require_internal_secret)])
def delete_session(session_id: str):
    if not store.delete(session_id):
        raise HTTPException(status_code=404, detail="Session not found")
    return JSONResponse(status_code=204, content=None)
