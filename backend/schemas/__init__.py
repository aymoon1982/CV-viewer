"""
TalentLens — Pydantic Request/Response Schemas
"""

from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from pydantic.alias_generators import to_camel

class CamelModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=to_camel,
        from_attributes=True,
    )


# ─── Jobs ────────────────────────────────────────────────────────────────────

class JobProfileCreate(CamelModel):
    title: str
    department: str = "Engineering"
    location: str = "Dubai, UAE"
    openings: int = 1
    description: str | None = None
    status: str = "draft"
    mandatory_criteria: dict = Field(default_factory=dict)
    preferred_criteria: dict = Field(default_factory=dict)
    scoring_weights: dict = Field(default_factory=dict)
    template_used: str | None = None


class JobProfileUpdate(CamelModel):
    title: str | None = None
    department: str | None = None
    location: str | None = None
    openings: int | None = None
    description: str | None = None
    status: str | None = None
    mandatory_criteria: dict | None = None
    preferred_criteria: dict | None = None
    scoring_weights: dict | None = None


class JobStatsResponse(CamelModel):
    uploaded: int = 0
    scored: int = 0
    shortlisted: int = 0
    eliminated: int = 0
    avg_score: float = 0
    score_distribution: list[dict] = Field(default_factory=list)


class JobProfileResponse(CamelModel):
    id: str
    title: str
    department: str
    location: str
    openings: int
    description: str | None
    status: str
    mandatory_criteria: dict
    preferred_criteria: dict
    scoring_weights: dict
    template_used: str | None
    created_at: datetime
    updated_at: datetime
    stats: JobStatsResponse = Field(default_factory=JobStatsResponse)


# ─── Candidates ──────────────────────────────────────────────────────────────

class CandidateStatusUpdate(CamelModel):
    status: str  # shortlisted | rejected | under_review


class CandidateResponse(CamelModel):
    id: str
    job_profile_id: str
    name: str
    email: str | None
    phone: str | None
    nationality: str | None
    age: int | None
    languages: list[str]
    current_title: str | None
    current_company: str | None
    years_experience: float
    degree_level: str | None
    degree_field: str | None
    education: list[dict]
    experience: list[dict]
    skills: list[dict]
    certifications: list[str]
    status: str
    final_score: float
    criterion_scores: dict
    ai_summary: str | None
    elimination_reason: str | None
    cv_file_path: str | None
    extraction_confidence: float
    shortlisted_at: datetime | None
    rejected_at: datetime | None
    created_at: datetime


# ─── Chat ────────────────────────────────────────────────────────────────────

class ChatRequest(CamelModel):
    message: str
    scope: str = "candidate"  # candidate | shortlist
    reference_id: str  # candidate_id or job_profile_id


class ChatMessageResponse(CamelModel):
    id: str
    role: str
    content: str
    sources: list[str]
    created_at: datetime


# ─── Settings ────────────────────────────────────────────────────────────────

class SettingsUpdate(CamelModel):
    general: dict | None = None
    ai: dict | None = None
    notifications: dict | None = None


class SettingsResponse(CamelModel):
    general: dict = Field(default_factory=dict)
    ai: dict = Field(default_factory=dict)
    notifications: dict = Field(default_factory=dict)


# ─── Scoring ─────────────────────────────────────────────────────────────────

class ScoreResponse(CamelModel):
    candidate_id: str
    final_score: float
    criterion_scores: dict
    ai_summary: str | None
    status: str
