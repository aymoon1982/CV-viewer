"""
TalentLens — SQLAlchemy ORM Models
All database tables for the application.
"""

import uuid
from datetime import datetime

from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    Text,
    DateTime,
    ForeignKey,
    Enum as SAEnum,
    Index,
    JSON,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from models.database import Base


# ─── Helpers ─────────────────────────────────────────────────────────────────

def generate_uuid() -> str:
    return str(uuid.uuid4())


def utcnow() -> datetime:
    return datetime.utcnow()


# ─── Job Profile ─────────────────────────────────────────────────────────────

class JobProfile(Base):
    __tablename__ = "job_profiles"

    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    department = Column(String(100), nullable=False)
    location = Column(String(255), default="Dubai, UAE")
    openings = Column(Integer, default=1)
    description = Column(Text, nullable=True)
    status = Column(String(20), default="draft")  # active | paused | closed | draft

    mandatory_criteria = Column(JSON, default=dict)
    preferred_criteria = Column(JSON, default=dict)
    scoring_weights = Column(JSON, default=dict)
    template_used = Column(String(100), nullable=True)

    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    # Relationships
    candidates = relationship("Candidate", back_populates="job_profile", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_job_profiles_status", "status"),
        Index("ix_job_profiles_department", "department"),
    )


# ─── Candidate ───────────────────────────────────────────────────────────────

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(String, primary_key=True, default=generate_uuid)
    job_profile_id = Column(String, ForeignKey("job_profiles.id"), nullable=False)

    # Personal info
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    nationality = Column(String(100), nullable=True)
    age = Column(Integer, nullable=True)
    languages = Column(JSON, default=list)

    # Professional info
    current_title = Column(String(255), nullable=True)
    current_company = Column(String(255), nullable=True)
    years_experience = Column(Float, default=0)
    degree_level = Column(String(50), nullable=True)
    degree_field = Column(String(255), nullable=True)

    # Extracted structured data (JSONB)
    education = Column(JSON, default=list)
    experience = Column(JSON, default=list)
    skills = Column(JSON, default=list)
    certifications = Column(JSON, default=list)

    # Scoring
    status = Column(String(30), default="uploaded")
    # uploaded | extracting | scoring | scored | shortlisted | under_review | rejected | eliminated
    final_score = Column(Float, default=0)
    criterion_scores = Column(JSON, default=dict)
    ai_summary = Column(Text, nullable=True)
    elimination_reason = Column(Text, nullable=True)
    extraction_confidence = Column(Float, default=0)

    # File
    cv_file_path = Column(String(500), nullable=True)
    cv_original_name = Column(String(255), nullable=True)

    # Timestamps
    shortlisted_at = Column(DateTime, nullable=True)
    rejected_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    # Relationships
    job_profile = relationship("JobProfile", back_populates="candidates")

    __table_args__ = (
        Index("ix_candidates_job_profile_id", "job_profile_id"),
        Index("ix_candidates_status", "status"),
        Index("ix_candidates_final_score", "final_score"),
    )


# ─── App Settings (Runtime Config) ──────────────────────────────────────────

class AppSetting(Base):
    __tablename__ = "app_settings"

    key = Column(String(100), primary_key=True)
    value = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)


# ─── Chat History ────────────────────────────────────────────────────────────

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, default=generate_uuid)
    scope = Column(String(20), nullable=False)  # candidate | shortlist
    reference_id = Column(String, nullable=False)  # candidate_id or job_profile_id
    role = Column(String(20), nullable=False)  # user | assistant
    content = Column(Text, nullable=False)
    sources = Column(JSON, default=list)
    created_at = Column(DateTime, default=utcnow)

    __table_args__ = (
        Index("ix_chat_messages_reference", "scope", "reference_id"),
    )


# ─── WhatsApp Models ────────────────────────────────────────────────
class WhatsAppThread(Base):
    __tablename__ = "whatsapp_threads"
    id = Column(String, primary_key=True, default=generate_uuid)
    candidate_id = Column(String, ForeignKey("candidates.id"))
    job_profile_id = Column(String, ForeignKey("job_profiles.id"))
    phone_number = Column(String(50))
    status = Column(String(20), default="screening")
    created_at = Column(DateTime, default=utcnow)

class WhatsAppMessage(Base):
    __tablename__ = "whatsapp_messages"
    id = Column(String, primary_key=True, default=generate_uuid)
    thread_id = Column(String, ForeignKey("whatsapp_threads.id"))
    direction = Column(String(20))  # inbound | outbound
    content = Column(Text)
    message_type = Column(String(20))
    sent_at = Column(DateTime, default=utcnow)
