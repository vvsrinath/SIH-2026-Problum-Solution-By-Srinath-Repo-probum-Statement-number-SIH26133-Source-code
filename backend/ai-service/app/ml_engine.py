"""
Lightweight AI inference module — Swasthya Sathi

Provides optional local model inference using sentence-transformers
for semantic similarity on symptom queries. Falls back to keyword
matching when the model is not available.

No external API calls — everything runs on CPU.
"""

from __future__ import annotations

import os
from pathlib import Path

# Lazy-load heavy ML libraries only if available
_model = None
_tokenizer = None
_model_available = None

# Symptom category embeddings (pre-computed for common queries)
SYMPTOM_CATEGORIES = {
    "respiratory": ["cough", "cold", "breathing", "sore throat", "runny nose", "chest tight"],
    "gastrointestinal": ["stomach", "nausea", "vomit", "diarrhea", "abdominal", "bloating"],
    "neurological": ["headache", "migraine", "dizziness", "numbness", "seizure", "confusion"],
    "musculoskeletal": ["joint pain", "back pain", "muscle", "stiffness", "swelling", "fracture"],
    "dermatological": ["rash", "itch", "skin", "acne", "burn", "wound"],
    "general": ["fever", "fatigue", "weakness", "weight loss", "appetite", "sleep"],
    "mental_health": ["anxiety", "stress", "depression", "insomnia", "panic", "mood"],
    "cardiac": ["chest pain", "palpitation", "heart", "blood pressure", "fainting"],
}

# Hindi symptom equivalents for multilingual support
HINDI_SYMPTOMS = {
    "bukhar": "general",
    "khansi": "respiratory",
    "sir dard": "neurological",
    "pet dard": "gastrointestinal",
    "joints": "musculoskeletal",
    "chakkar": "neurological",
    "ghabrahat": "mental_health",
    "dil ki dhadkan": "cardiac",
}


def _try_load_model():
    """Attempt to load sentence-transformers model. Returns False if unavailable."""
    global _model, _tokenizer, _model_available

    if _model_available is not None:
        return _model_available

    try:
        # Try sentence-transformers first (lightweight)
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer("all-MiniLM-L6-v2")
        _model_available = True
        return True
    except ImportError:
        pass

    try:
        # Fallback: try transformers with a small model
        from transformers import AutoTokenizer, AutoModel
        import torch

        model_name = "distilbert-base-uncased"
        _tokenizer = AutoTokenizer.from_pretrained(model_name)
        _model = AutoModel.from_pretrained(model_name)
        _model_available = True
        return True
    except (ImportError, Exception):
        _model_available = False
        return False


def classify_symptom_category(text: str) -> str:
    """
    Classify a symptom description into a medical category.
    Uses semantic similarity when model is available, falls back to keywords.
    """
    text_lower = text.lower()

    # Check Hindi first
    for hindi_word, category in HINDI_SYMPTOMS.items():
        if hindi_word in text_lower:
            return category

    # Try model-based classification
    if _try_load_model() and _model is not None:
        try:
            import numpy as np

            # Encode input text
            text_embedding = _model.encode([text_lower])

            best_category = "general"
            best_score = -1

            for category, keywords in SYMPTOM_CATEGORIES.items():
                # Encode category keywords
                keyword_embeddings = _model.encode(keywords)
                # Compute similarity
                similarities = np.dot(keyword_embeddings, text_embedding.T).flatten()
                max_sim = float(similarities.max())

                if max_sim > best_score:
                    best_score = max_sim
                    best_category = category

            if best_score > 0.3:  # Threshold for confidence
                return best_category
        except Exception:
            pass  # Fall through to keyword matching

    # Keyword fallback
    keyword_map = {
        "respiratory": ["cough", "cold", "breathing", "throat", "nose", "respiratory"],
        "gastrointestinal": ["stomach", "nausea", "vomit", "diarrhea", "abdomen", "bowel"],
        "neurological": ["headache", "migraine", "dizzy", "numbness", "seizure", "brain"],
        "musculoskeletal": ["joint", "back", "muscle", "bone", "stiff", "swelling"],
        "dermatological": ["rash", "itch", "skin", "acne", "burn", "wound"],
        "general": ["fever", "tired", "weak", "fatigue", "appetite", "sleep"],
        "mental_health": ["anxiety", "stress", "depression", "insomnia", "panic", "mood"],
        "cardiac": ["chest", "heart", "palpitation", "blood pressure", "faint"],
    }

    for category, keywords in keyword_map.items():
        if any(kw in text_lower for kw in keywords):
            return category

    return "general"


def get_model_info() -> dict:
    """Return info about the current model state."""
    loaded = _try_load_model()
    return {
        "model_loaded": loaded,
        "model_type": "sentence-transformers" if loaded else "keyword-fallback",
        "categories": list(SYMPTOM_CATEGORIES.keys()),
        "supported_languages": ["en", "hi"],
    }
