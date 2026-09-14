"""Pydantic request/response models for the API."""
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    session_id: str | None = None
    lang: str = "auto"
    role: str = "visitor"
    features: list[str] = Field(default_factory=list)


class ChatResponse(BaseModel):
    session_id: str
    agent: str
    reply: str
    emergency: bool = False
    lang: str = "en"


class TranslateRequest(BaseModel):
    text: str = Field(min_length=1, max_length=4000)
    to: str = Field(min_length=2, max_length=8)
    source: str = "auto"


class TranslateResponse(BaseModel):
    text: str
    from_lang: str
    to_lang: str


class SessionInfo(BaseModel):
    id: str
    message_count: int


class SessionsResponse(BaseModel):
    sessions: list[SessionInfo]


class HealthResponse(BaseModel):
    status: str
    model: str
    backend: str
    message: str


class RuleTriageRequest(BaseModel):
    symptoms: str = Field(min_length=2, max_length=2000)
    duration: str | None = None
    age_group: str | None = None
    context: dict[str, str] | None = None


class RedFlag(BaseModel):
    id: str
    message: str
    action: str


class RuleTriageResponse(BaseModel):
    risk_level: str
    risk_score: float
    possible_conditions: list[str]
    red_flags: list[RedFlag]
    missing_information: list[str]
    recommended_action: str
    reason: list[str]
    next_steps: list[str]
    self_care: list[str]
    seek_care_if: list[str]
    disclaimer: str
    model_version: str
    source: str
