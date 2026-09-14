"""Central configuration for the Swasthya Sathi AI backend.
No external LLM dependency — uses local rule-based engine.
"""
import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

# App behaviour ------------------------------------------------------------
CORS_ORIGINS = [
    o.strip()
    for o in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174",
    ).split(",")
    if o.strip()
]
MAX_HISTORY_MESSAGES = int(os.getenv("MAX_HISTORY_MESSAGES", "20"))

# Internal shared secret used by the Node backend to call this service.
AI_SERVICE_SECRET = os.getenv("AI_SERVICE_SECRET", "").strip()
