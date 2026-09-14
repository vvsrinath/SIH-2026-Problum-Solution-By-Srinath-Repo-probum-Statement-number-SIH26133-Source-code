"""Rule-based symptom assessment engine for Swasthya Sathi.

Loads JSON rule files and evaluates patient symptoms against them.
No external LLM dependency — fully deterministic and explainable.
"""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

_RULES_DIR = Path(__file__).parent / "rules"

# ---------------------------------------------------------------------------
# Rule loading
# ---------------------------------------------------------------------------

def _load_json(filename: str) -> dict[str, Any]:
    path = _RULES_DIR / filename
    if not path.exists():
        raise FileNotFoundError(f"Rule file not found: {path}")
    with open(path, encoding="utf-8") as f:
        return json.load(f)


_symptoms_data: dict[str, Any] | None = None
_red_flags_data: dict[str, Any] | None = None
_care_guidance_data: dict[str, Any] | None = None
_followup_data: dict[str, Any] | None = None


def _ensure_loaded() -> None:
    global _symptoms_data, _red_flags_data, _care_guidance_data, _followup_data
    if _symptoms_data is None:
        _symptoms_data = _load_json("symptoms.json")
    if _red_flags_data is None:
        _red_flags_data = _load_json("red_flags.json")
    if _care_guidance_data is None:
        _care_guidance_data = _load_json("care_guidance.json")
    if _followup_data is None:
        _followup_data = _load_json("followup_questions.json")


def get_symptom_vocabulary() -> dict[str, Any]:
    _ensure_loaded()
    return _symptoms_data  # type: ignore[return-value]


# ---------------------------------------------------------------------------
# Symptom matching
# ---------------------------------------------------------------------------

def _build_keyword_index() -> dict[str, tuple[str, str]]:
    """Map every alias/label/id to (category, symptom_id)."""
    _ensure_loaded()
    index: dict[str, tuple[str, str]] = {}
    for cat_key, cat in _symptoms_data["categories"].items():  # type: ignore[union-attr]
        for sym in cat["symptoms"]:
            # Index the id itself
            index[sym["id"].lower()] = (cat_key, sym["id"])
            # Index the label
            index[sym["label"].lower()] = (cat_key, sym["id"])
            # Index every alias
            for alias in sym.get("aliases", []):
                index[alias.lower()] = (cat_key, sym["id"])
    return index


_KEYWORD_INDEX: dict[str, tuple[str, str]] | None = None


def _get_keyword_index() -> dict[str, tuple[str, str]]:
    global _KEYWORD_INDEX
    if _KEYWORD_INDEX is None:
        _KEYWORD_INDEX = _build_keyword_index()
    return _KEYWORD_INDEX


def match_symptoms(text: str) -> list[dict[str, Any]]:
    """Match free-text symptom description against the vocabulary.

    Returns a list of matched symptoms with metadata.
    """
    idx = _get_keyword_index()
    text_lower = text.lower()
    matched: dict[str, dict[str, Any]] = {}

    # Sort by length descending so longer phrases match before shorter ones
    sorted_keys = sorted(idx.keys(), key=len, reverse=True)

    for keyword in sorted_keys:
        cat, sym_id = idx[keyword]
        if sym_id in matched:
            continue
        # Use word boundary matching for short keywords
        if len(keyword) <= 3:
            pattern = r'\b' + re.escape(keyword) + r'\b'
            if not re.search(pattern, text_lower):
                continue
        elif keyword not in text_lower:
            continue

        # Get severity weight from vocabulary
        _ensure_loaded()
        weight = 1.0
        for cat_data in _symptoms_data["categories"].values():  # type: ignore[union-attr]
            for sym in cat_data["symptoms"]:
                if sym["id"] == sym_id:
                    weight = sym.get("severity_weight", 1.0)
                    break

        matched[sym_id] = {
            "id": sym_id,
            "category": cat,
            "severity_weight": weight,
        }

    return list(matched.values())


# ---------------------------------------------------------------------------
# Red-flag detection
# ---------------------------------------------------------------------------

def check_red_flags(symptom_ids: list[str]) -> tuple[str | None, list[dict[str, str]]]:
    """Check matched symptoms against red-flag rules.

    Returns (max_escalation_level, alerts). The escalation level is the
    highest `escalate_to` among triggered rules (URGENT > HIGH > MODERATE).
    """
    _ensure_loaded()
    alerts: list[dict[str, str]] = []
    id_set = set(symptom_ids)

    level_rank = {"MODERATE": 1, "HIGH": 2, "URGENT": 3}
    max_level: str | None = None
    max_rank = 0

    for rule in _red_flags_data["rules"]:  # type: ignore[union-attr]
        required = set(rule["symptom_ids"])
        condition = rule.get("condition", "any")

        triggered = (
            required.issubset(id_set) if condition == "all" else bool(required & id_set)
        )
        if not triggered:
            continue

        alerts.append({"id": rule["id"], "message": rule["message"], "action": rule["action"]})
        level = rule.get("escalate_to", "URGENT")
        rank = level_rank.get(level, 3)
        if rank > max_rank:
            max_rank = rank
            max_level = level

    return max_level, alerts


# ---------------------------------------------------------------------------
# Risk scoring
# ---------------------------------------------------------------------------

def _compute_base_risk(symptoms: list[dict[str, Any]]) -> tuple[str, float]:
    """Compute base risk level from symptom severity weights.

    Returns (risk_level, raw_score).
    """
    if not symptoms:
        return "UNKNOWN", 0.0

    total = sum(s["severity_weight"] for s in symptoms)
    avg = total / len(symptoms)
    max_weight = max(s["severity_weight"] for s in symptoms)

    # Score combines total severity, average, and peak
    score = (total * 0.4) + (avg * 0.4) + (max_weight * 0.2)

    if score >= 3.0:
        return "HIGH", score
    elif score >= 1.8:
        return "MODERATE", score
    else:
        return "LOW", score


def _match_conditions(symptom_ids: list[str]) -> tuple[list[str], str | None]:
    """Check if symptoms match known condition groups.

    Returns (conditions, risk_floor) where risk_floor is the highest
    `default_risk` among matched groups, used as a minimum risk level.
    """
    _ensure_loaded()
    conditions: list[str] = []
    id_set = set(symptom_ids)

    risk_rank = {"LOW": 1, "MODERATE": 2, "HIGH": 3, "URGENT": 4}
    floor_rank = 0
    risk_floor: str | None = None

    for _key, group in _care_guidance_data.get("condition_associations", {}).items():  # type: ignore[union-attr]
        required = set(group["symptom_ids"])
        min_match = group.get("min_match", 2)
        matched_count = len(required & id_set)
        if matched_count >= min_match:
            conditions.extend(group["possible_conditions"])
            level = group.get("default_risk", "LOW")
            rank = risk_rank.get(level, 1)
            if rank > floor_rank:
                floor_rank = rank
                risk_floor = level

    return list(dict.fromkeys(conditions)), risk_floor


def _risk_floor(level: str, floor: str | None) -> str:
    """Raise level to floor if floor is higher."""
    if not floor:
        return level
    order = ["LOW", "MODERATE", "HIGH", "URGENT"]
    return floor if order.index(floor) > order.index(level) else level


def _apply_duration_adjustment(risk_level: str, score: float, duration: str | None) -> tuple[str, float]:
    """Adjust risk based on symptom duration."""
    if not duration:
        return risk_level, score

    adjustments = {
        "just_started": 0,
        "1_3_days": 0,
        "4_7_days": 0.2,
        "1_2_weeks": 0.5,
        "more_than_2_weeks": 0.8,
    }
    adj = adjustments.get(duration, 0)
    if adj == 0:
        return risk_level, score

    new_score = score + adj
    if new_score >= 3.0:
        return "HIGH", new_score
    elif new_score >= 1.8:
        return "MODERATE", new_score
    return risk_level, new_score


def _apply_age_adjustment(risk_level: str, score: float, age_group: str | None) -> tuple[str, float]:
    """Adjust risk for vulnerable age groups."""
    if not age_group:
        return risk_level, score

    adjustments = {
        "infant": 0.5,
        "child": 0.3,
        "elderly": 0.4,
    }
    adj = adjustments.get(age_group, 0)
    if adj == 0:
        return risk_level, score

    new_score = score + adj
    if new_score >= 3.0:
        return "HIGH", new_score
    elif new_score >= 1.8:
        return "MODERATE", new_score
    return risk_level, new_score


def _apply_context_adjustment(
    risk_level: str,
    score: float,
    context: dict[str, str] | None,
) -> tuple[str, float]:
    """Apply risk adjustments from answered follow-up questions (severity,
    pregnancy, chronic conditions, medications) using the impact table in
    followup_questions.json."""
    if not context:
        return risk_level, score

    _ensure_loaded()
    impacts: dict[str, float] = {}
    for q in _followup_data["questions"]:  # type: ignore[union-attr]
        answer = context.get(q["id"])
        if not answer:
            continue
        impact = q.get("impact", {}).get(answer, {})
        adj = impact.get("risk_adjustment", 0) or 0
        if adj:
            impacts[q["id"]] = float(adj)

    if not impacts:
        return risk_level, score

    total = sum(impacts.values())
    new_score = score + total
    if new_score >= 3.0:
        return "HIGH", new_score
    elif new_score >= 1.8:
        return "MODERATE", new_score
    return risk_level, new_score


# ---------------------------------------------------------------------------
# Main assessment function
# ---------------------------------------------------------------------------

def assess_symptoms(
    symptoms_text: str,
    duration: str | None = None,
    age_group: str | None = None,
    context: dict[str, str] | None = None,
) -> dict[str, Any]:
    """Run the full rule-based assessment pipeline.

    Args:
        symptoms_text: Free-text description of symptoms.
        duration: Duration code (e.g. "1_3_days", "4_7_days").
        age_group: Age group code (e.g. "adult", "child", "infant").
        context: Answers to follow-up questions (id -> option value).

    Returns:
        Structured assessment result with risk_level, conditions, actions, etc.
    """
    _ensure_loaded()

    # Step 1: Match symptoms
    matched = match_symptoms(symptoms_text)
    symptom_ids = [s["id"] for s in matched]

    # Step 2: Check red flags FIRST
    escalation, red_flags = check_red_flags(symptom_ids)
    if red_flags:
        risk_level = escalation or "URGENT"
        conditions, _ = _match_conditions(symptom_ids)
        return {
            "risk_level": risk_level,
            "risk_score": 5.0,
            "possible_conditions": conditions or ["Emergency evaluation needed"],
            "red_flags": red_flags,
            "missing_information": _suggest_followups(symptom_ids, duration, age_group),
            "recommended_action": red_flags[0]["action"],
            "reason": [rf["message"] for rf in red_flags],
            "next_steps": [
                "Go to the nearest hospital immediately",
                "Call emergency services if available",
                "Inform medical staff of all symptoms",
            ],
            "self_care": [],
            "seek_care_if": [],
            "disclaimer": "This is care guidance, not a medical diagnosis. Always consult a qualified healthcare professional.",
            "model_version": "rule-based-v1.0",
            "source": "RULE_ENGINE",
        }

    # Step 3: Compute base risk
    risk_level, score = _compute_base_risk(matched)

    # Step 4: Apply contextual adjustments
    risk_level, score = _apply_duration_adjustment(risk_level, score, duration)
    risk_level, score = _apply_age_adjustment(risk_level, score, age_group)
    risk_level, score = _apply_context_adjustment(risk_level, score, context)

    # Step 5: Match conditions and apply any risk floor
    conditions, risk_floor = _match_conditions(symptom_ids)
    risk_level = _risk_floor(risk_level, risk_floor)

    # Step 6: Get care guidance
    guidance = _care_guidance_data["risk_levels"].get(risk_level, _care_guidance_data["risk_levels"]["UNKNOWN"])  # type: ignore[union-attr]

    # Step 7: Suggest follow-up questions
    missing = _suggest_followups(symptom_ids, duration, age_group)

    # Step 8: Build reason list
    reason_parts: list[str] = []
    if not matched:
        reason_parts.append(
            "Your symptoms could not be matched to a known pattern — please describe them in simpler, common terms or ask a health worker for help."
        )
    for s in matched:
        _ensure_loaded()
        for cat_data in _symptoms_data["categories"].values():  # type: ignore[union-attr]
            for sym in cat_data["symptoms"]:
                if sym["id"] == s["id"]:
                    reason_parts.append(f"{sym['label']} was reported")
                    break

    return {
        "risk_level": risk_level,
        "risk_score": round(score, 2),
        "possible_conditions": conditions if conditions else ["General health concern"],
        "red_flags": [],
        "missing_information": missing,
        "recommended_action": guidance["recommended_action"],
        "reason": reason_parts if reason_parts else ["Symptoms were reported"],
        "next_steps": guidance["next_steps"],
        "self_care": guidance.get("self_care", []),
        "seek_care_if": guidance.get("seek_care_if", []),
        "disclaimer": "This is care guidance, not a medical diagnosis. Always consult a qualified healthcare professional.",
        "model_version": "rule-based-v1.0",
        "source": "RULE_ENGINE",
    }


def _suggest_followups(
    symptom_ids: list[str],
    duration: str | None,
    age_group: str | None,
) -> list[str]:
    """Suggest follow-up questions based on what's missing."""
    questions: list[str] = []

    if not duration:
        questions.append("How long have you had these symptoms?")
    if not age_group:
        questions.append("What is the patient's age group?")

    # Suggest relevant context questions based on symptoms
    cardiac_symptoms = {"chest_pain", "palpitations", "shortness_of_breath"}
    urinary_symptoms = {"painful_urination", "frequent_urination", "blood_in_urine"}

    if cardiac_symptoms & set(symptom_ids):
        questions.append("Do you have any heart conditions or high blood pressure?")

    if urinary_symptoms & set(symptom_ids):
        questions.append("Is the patient female and could they be pregnant?")

    if "fever" in symptom_ids:
        questions.append("What is the current body temperature?")

    if "diarrhea" in symptom_ids or "vomiting" in symptom_ids:
        questions.append("How many times has this occurred in the last 24 hours?")

    return questions[:5]  # limit to 5 questions


# ---------------------------------------------------------------------------
# Public API for follow-up questions
# ---------------------------------------------------------------------------

def get_followup_questions(
    symptom_ids: list[str],
    answered: dict[str, str] | None = None,
    limit: int = 6,
) -> list[dict[str, Any]]:
    """Get relevant follow-up questions, excluding already answered ones.

    Prioritizes timing and severity questions, then symptom-specific
    context questions (chronic conditions, medications, pregnancy).
    """
    _ensure_loaded()
    answered = answered or {}
    by_id = {q["id"]: q for q in _followup_data["questions"]}  # type: ignore[union-attr]

    ordered: list[str] = ["duration", "severity", "age_group"]

    symptom_set = set(symptom_ids)
    cardiac = symptom_set & {"chest_pain", "palpitations", "shortness_of_breath", "dizziness", "swelling"}
    respiratory = symptom_set & {"cough", "wheezing", "shortness_of_breath", "chest_tightness"}
    chronic_relevant = bool(cardiac or respiratory or "fever" in symptom_set)

    extra: list[str] = []
    if chronic_relevant:
        extra += ["chronic_conditions", "current_medications"]
    if symptom_set:
        extra.append("pregnancy")

    relevant: list[dict[str, Any]] = []
    seen: set[str] = set()
    for qid in ordered + extra:
        if qid in seen or qid in answered:
            continue
        seen.add(qid)
        if qid in by_id:
            relevant.append(by_id[qid])

    return relevant[:limit]


def get_risk_info(risk_level: str) -> dict[str, Any]:
    """Get care guidance for a risk level."""
    _ensure_loaded()
    return _care_guidance_data["risk_levels"].get(risk_level, _care_guidance_data["risk_levels"]["UNKNOWN"])  # type: ignore[return-value]
