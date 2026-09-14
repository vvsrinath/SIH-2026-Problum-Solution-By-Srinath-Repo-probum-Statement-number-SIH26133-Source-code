"""Local rule-based response engine — no external LLM required.

Provides triage routing and template-based medical/app-care/translation
responses good enough for a hackathon demo. Swap for a real local model
(e.g. ONNX, llama.cpp) when hardware allows.
"""
from __future__ import annotations

import json
import re
from typing import Optional

# ---------------------------------------------------------------------------
# Symptom / intent keyword banks
# ---------------------------------------------------------------------------

SYMPTOM_KEYWORDS: list[str] = [
    "fever", "cough", "cold", "headache", "migraine", "stomach", "pain",
    "vomit", "nausea", "diarrhea", "rash", "itch", "fatigue", "tired",
    "sore throat", "runny nose", "body ache", "chills", "dizzy",
    "chest pain", "breathless", "swelling", "bleeding", "burn",
    "joint pain", "back pain", "tooth", "ear ache", "eye",
    "anxiety", "stress", "insomnia", "sleep", "appetite",
    # Hindi
    "बुखार", "खांसी", "सिरदर्द", "पेट दर्द", "उल्टी", "दस्त", "चक्कर",
    # Tamil
    "காய்ச்சல்", "இருமல்", "தலைவலி", "வயிற்று வலி",
]

APP_KEYWORDS: list[str] = [
    "appointment", "book", "schedule", "cancel appointment",
    "record", "health record", "history", "prescription",
    "referral", "follow up", "follow-up",
    "hospital", "clinic", "phc", "health center", "map",
    "find doctor", "search doctor", "specialist",
    "login", "register", "sign up", "password", "profile",
    "notification", "settings", "language",
    # Hindi
    "अपॉइंटमेंट", "बुकिंग", "रिकॉर्ड", "अस्पताल", "डॉक्टर",
]

TRANSLATE_KEYWORDS: list[str] = [
    "translate", "translation", "say in", "how do i say",
    "meaning in", "write in", "convert to",
]

# ---------------------------------------------------------------------------
# Simple symptom → advice mapping (template-based)
# ---------------------------------------------------------------------------

SYMPTOM_ADVICE: dict[str, dict[str, str]] = {
    "fever": {
        "response": (
            "**Fever** can be caused by many things — infection, heat, or inflammation.\n\n"
            "- Rest and drink plenty of fluids (ORS, warm water).\n"
            "- Paracetamol (500 mg) may help reduce fever — follow packet dosage.\n"
            "- Use a cold compress on the forehead.\n\n"
            "**See a doctor if:** fever lasts > 3 days, is above 103°F (39.4°C), "
            "or is accompanied by stiff neck, rash, or difficulty breathing.\n\n"
            "Call **108** in an emergency."
        ),
    },
    "cough": {
        "response": (
            "**Cough** can be viral, allergic, or due to dust/irritants.\n\n"
            "- Drink warm water, honey-lemon tea, or ginger water.\n"
            "- Avoid cold drinks and dusty environments.\n"
            "- Steam inhalation may help relieve congestion.\n\n"
            "**See a doctor if:** cough lasts > 2 weeks, produces blood, "
            "or is accompanied by high fever or chest pain."
        ),
    },
    "headache": {
        "response": (
            "**Headache** is common and usually not serious.\n\n"
            "- Rest in a quiet, dark room.\n"
            "- Apply a cold or warm compress to your forehead or neck.\n"
            "- Stay hydrated — drink water or ORS.\n"
            "- Paracetamol (500 mg) can help — follow dosage.\n\n"
            "**See a doctor if:** sudden severe headache, headache with fever and stiff neck, "
            "or headache after an injury."
        ),
    },
    "stomach": {
        "response": (
            "**Stomach pain** can have many causes — gas, indigestion, infection, or more.\n\n"
            "- Drink warm water; avoid spicy/fried food.\n"
            "- Light meals (rice, curd, banana) are best.\n"
            "- ORS if there is diarrhea or vomiting.\n\n"
            "**See a doctor if:** pain is severe, lasts > 2 days, "
            "blood in stool, or accompanied by high fever."
        ),
    },
    "cold": {
        "response": (
            "**Common cold** is usually viral and resolves in 5–7 days.\n\n"
            "- Rest, drink warm fluids, and stay warm.\n"
            "- Steam inhalation and salt-water gargle help with congestion.\n"
            "- Avoid antibiotics unless prescribed by a doctor.\n\n"
            "**See a doctor if:** symptoms worsen after 5 days, high fever, or breathing difficulty."
        ),
    },
}

DEFAULT_SYMPTOM_RESPONSE = (
    "I understand you're not feeling well. Here's general guidance:\n\n"
    "- **Rest** and drink plenty of fluids (water, ORS, warm soups).\n"
    "- **Monitor** your temperature and symptoms.\n"
    "- **Light meals** — avoid spicy or heavy food.\n\n"
    "**See a doctor if:** symptoms are severe, persist for more than 2–3 days, "
    "or you experience high fever, difficulty breathing, or chest pain.\n\n"
    "Call **108** in an emergency. I'm an AI assistant — please consult a healthcare "
    "professional for a proper diagnosis."
)

APP_CARE_RESPONSE = (
    "I can help you navigate **Swasthya Sathi**! Here's what the app offers:\n\n"
    "**For Patients:**\n"
    "- Find hospitals/PHCs on the map\n"
    "- Book and manage appointments\n"
    "- View health records and prescriptions\n"
    "- Get referrals and follow-up reminders\n"
    "- Online consultation with doctors\n\n"
    "**For Doctors:**\n"
    "- Manage appointments and availability\n"
    "- View patient records (with consent)\n"
    "- Create referrals and follow-ups\n\n"
    "**For Health Workers:**\n"
    "- Field triage and home visits\n"
    "- Manage assigned patients\n\n"
    "What would you like help with?"
)

TRANSLATE_FALLBACK = (
    "I'd love to help with translation! For accurate medical translations "
    "across 12 Indian languages, our full translation service is being set up. "
    "In the meantime, try asking about symptoms or app features."
)

GREETING_RESPONSE = (
    "Namaste! I'm **Swasthya Mitra**, your health assistant on Swasthya Sathi.\n\n"
    "I can help you with:\n"
    "- **Health questions** — describe symptoms and I'll share general guidance\n"
    "- **App help** — how to use appointments, records, referrals, and more\n"
    "- **Translation** — convert text between Indian languages\n\n"
    "What would you like help with today?"
)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def classify_intent(message: str) -> str:
    """Return 'symptom', 'app', 'translate', or 'general'."""
    lowered = message.lower()

    if any(kw in lowered for kw in TRANSLATE_KEYWORDS):
        return "translate"
    if any(kw in lowered for kw in APP_KEYWORDS):
        return "app"
    if any(kw in lowered for kw in SYMPTOM_KEYWORDS):
        return "symptom"
    return "general"


def _find_matching_symptom(message: str) -> Optional[str]:
    lowered = message.lower()
    for key in SYMPTOM_ADVICE:
        if key in lowered:
            return key
    return None


def generate_response(message: str, lang: str = "en") -> tuple[str, str]:
    """Return (reply_text, agent_name)."""
    intent = classify_intent(message)

    if intent == "translate":
        return TRANSLATE_FALLBACK, "Wording"

    if intent == "app":
        return APP_CARE_RESPONSE, "Care Navigator"

    if intent == "symptom":
        matched = _find_matching_symptom(message)
        if matched:
            return SYMPTOM_ADVICE[matched]["response"], "Medical Advisor"
        return DEFAULT_SYMPTOM_RESPONSE, "Medical Advisor"

    # general / greeting
    if any(w in message.lower() for w in ("hello", "hi", "hey", "namaste", "नमस्ते", "வணக்கம்")):
        return GREETING_RESPONSE, "Triage"

    return (
        "I'm **Swasthya Mitra**, here to help with health questions, app guidance, "
        "and translations. Could you tell me more about what you need?\n\n"
        "You can ask about symptoms, how to use the app, or request a translation.",
        "Triage",
    )


# ---------------------------------------------------------------------------
# Structured symptom-triage assessment (deterministic JSON reply)
# ---------------------------------------------------------------------------

RED_FLAG_KEYWORDS: list[str] = [
    "chest pain", "difficulty breathing", "breathless", "short of breath",
    "unconscious", "passing out", "fainting", "seizure", "stiff neck",
    "uncontrolled bleeding", "coughing blood", "blood in stool",
    "high fever", "very high", "103", "104",
]

HIGH_RISK_KEYWORDS: list[str] = [
    "persistent vomiting", "bloody", "severe headache", "dehydration",
    "difficulty swallowing", "swollen", "rash", "severe pain",
]

MODERATE_KEYWORDS: list[str] = [
    "fever", "cough", "diarrhea", "diarrhoea", "vomiting", "vomit", "nausea",
    "sore throat", "body ache", "chills", "dizzy", "headache", "stomach",
    "pain", "stomach pain",
]

LOW_KEYWORDS: list[str] = [
    "cold", "runny nose", "fatigue", "tired", "mild", "sneezing", "sleep",
    "insomnia",
]

CONDITION_GROUPS: list[tuple[set[str], list[str]]] = [
    (
        {"chest pain", "difficulty breathing", "breathless", "short of breath"},
        ["Possible cardiac or respiratory condition requiring urgent evaluation"],
    ),
    (
        {"fever", "cough", "sore throat", "runny nose", "cold"},
        ["Upper respiratory tract infection (common cold / flu-like illness)"],
    ),
    (
        {"fever", "cough"},
        ["Viral fever", "Upper respiratory tract infection"],
    ),
    (
        {"stomach", "stomach pain", "vomit", "vomiting", "nausea", "diarrhea", "diarrhoea"},
        ["Acute gastroenteritis / food-related illness"],
    ),
    (
        {"headache", "dizzy", "severe headache"},
        ["Tension-type headache / migraine"],
    ),
    (
        {"dizzy", "tired", "fatigue", "sleep", "insomnia"},
        ["Fatigue / possible low blood pressure or anaemia"],
    ),
    (
        {"fever", "rash"},
        ["Viral illness with rash"],
    ),
    (
        {"joint pain", "back pain", "swelling"},
        ["Musculoskeletal pain"],
    ),
]


def _extract_symptoms(message: str) -> list[str]:
    """Pick known symptom keywords from the 'Symptoms:' line of the prompt."""
    match = re.search(r"[Ss]ymptoms:\s*(.+)", message)
    text = match.group(1).lower() if match else message.lower()
    found: list[str] = []
    for keyword in SYMPTOM_KEYWORDS:
        if keyword.lower() in text:
            found.append(keyword)
    return found


def generate_triage_assessment(message: str) -> str:
    """Return a deterministic JSON symptom-triage assessment.

    Follows a transparent pipeline: symptom matching -> risk rules ->
    red-flag safety override -> recommended care. The reply is pure JSON so
    the Node backend can parse it directly. Never claims a definitive
    diagnosis or fabricates confidence values.
    """
    text_lower = message.lower()
    symptoms = _extract_symptoms(message)

    red_flags = [kw for kw in RED_FLAG_KEYWORDS if kw in text_lower]
    high_hits = [kw for kw in HIGH_RISK_KEYWORDS if kw in text_lower]
    moderate_hits = [kw for kw in MODERATE_KEYWORDS if kw in text_lower]
    low_hits = [kw for kw in LOW_KEYWORDS if kw in text_lower]

    if red_flags:
        risk = "URGENT"
        conditions = ["Possible serious condition requiring urgent evaluation"]
        recommended = "Seek emergency care immediately (call 108)."
    elif high_hits:
        risk = "HIGH"
        conditions = _conditions_for(symptoms)
        recommended = "Consult a doctor as soon as possible — within 24 hours."
    elif moderate_hits:
        risk = "MODERATE"
        conditions = _conditions_for(symptoms)
        recommended = "Book a consultation with a primary-care doctor in the next day or two."
    elif low_hits:
        risk = "LOW"
        conditions = _conditions_for(symptoms)
        recommended = "Home care and monitoring; see a doctor if symptoms worsen."
    else:
        risk = "UNKNOWN"
        conditions = []
        recommended = "Please consult a healthcare professional."

    missing = _missing_information(message, symptoms)

    return json.dumps(
        {
            "riskLevel": risk,
            "possibleConditions": conditions,
            "missingInformation": missing,
            "recommendedAction": recommended,
        },
        ensure_ascii=False,
    )


def _conditions_for(symptoms: list[str]) -> list[str]:
    """Return possible condition categories for the best-matching symptom set."""
    if not symptoms:
        return []
    scored = [
        (sum(1 for s in symptoms if s in group), labels)
        for group, labels in CONDITION_GROUPS
        if any(s in group for s in symptoms)
    ]
    if not scored:
        return ["Unspecified illness — professional evaluation advised"]
    best = max(score for score, _ in scored)
    merged: list[str] = []
    for score, labels in scored:
        if score == best:
            for label in labels:
                if label not in merged:
                    merged.append(label)
    return merged[:2]


def _missing_information(message: str, symptoms: list[str]) -> list[str]:
    """Note honest missing detail so the UI can ask useful follow-ups."""
    missing: list[str] = []
    text_lower = message.lower()
    duration_terms = ("since", "days", "weeks", "months", "duration")
    if not any(t in text_lower for t in duration_terms):
        missing.append("Duration of symptoms")
    if not any(t in text_lower for t in ("mild", "moderate", "severe")):
        missing.append("Severity (mild / moderate / severe)")
    if not any(t in text_lower for t in ("breath", "breathing", "chest")):
        missing.append("Presence of red-flag symptoms (breathing difficulty, chest pain)")
    if "medicine" not in text_lower and "medication" not in text_lower:
        missing.append("Ongoing medicines or chronic conditions")
    return missing[:3]
