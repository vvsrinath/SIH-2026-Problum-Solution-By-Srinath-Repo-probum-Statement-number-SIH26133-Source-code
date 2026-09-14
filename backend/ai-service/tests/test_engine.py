"""Tests for the AI service rule-based engine."""
import sys
from pathlib import Path

# Add the ai-service app to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.engine import classify_intent, generate_response
from app.security import detect_emergency, emergency_reply


def test_classify_symptom():
    assert classify_intent("I have a fever and headache") == "symptom"
    assert classify_intent("My stomach hurts") == "symptom"
    assert classify_intent("cough for 3 days") == "symptom"


def test_classify_app():
    assert classify_intent("How do I book an appointment?") == "app"
    assert classify_intent("Where can I find my health records?") == "app"


def test_classify_translate():
    assert classify_intent("Translate fever to Hindi") == "translate"
    assert classify_intent("How do I say headache in Tamil?") == "translate"


def test_greeting():
    reply, agent = generate_response("hello")
    assert "Swasthya Mitra" in reply
    assert agent == "Triage"


def test_symptom_response():
    reply, agent = generate_response("I have a fever")
    assert "Fever" in reply
    assert "doctor" in reply
    assert agent == "Medical Advisor"


def test_app_response():
    reply, agent = generate_response("How do I book an appointment?")
    assert "Swasthya Sathi" in reply
    assert agent == "Care Navigator"


def test_emergency_detection():
    assert detect_emergency("I am having chest pain") is True
    assert detect_emergency("dil ka daura") is True
    assert detect_emergency("I have a mild cold") is False


def test_emergency_reply():
    reply = emergency_reply()
    assert "108" in reply
    assert "112" in reply
