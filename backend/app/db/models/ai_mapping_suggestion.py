import uuid
from typing import Optional, Dict, Any, List
from sqlalchemy import String, Float, Boolean, Text, ForeignKey, Index, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class MappingSuggestionStatus:
    SUGGESTED = "SUGGESTED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    NEEDS_REVIEW = "NEEDS_REVIEW"


from datetime import datetime

class AiMappingSuggestion(Base, TimestampMixin):
    """
    Stores AI-suggested field mappings between incoming department schemas and canonical fields.
    Every suggestion defaults to status = SUGGESTED and requires_human_approval = True.
    """
    __tablename__ = "ai_mapping_suggestions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    department: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True
    )
    schema_version: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="1.0"
    )
    source_field: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True
    )
    source_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )
    source_description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    canonical_field: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True
    )
    canonical_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )
    confidence_score: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )
    confidence_category: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="MEDIUM"
    )
    reason: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )
    evidence: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON().with_variant(JSONB, "postgresql"),
        nullable=True
    )
    candidate_fields: Mapped[Optional[List[str]]] = mapped_column(
        JSON().with_variant(JSONB, "postgresql"),
        nullable=True
    )
    requires_human_approval: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True
    )
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default=MappingSuggestionStatus.SUGGESTED,
        index=True
    )
    reviewed_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        nullable=True
    )
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(
        nullable=True
    )
    rejection_reason: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    model_provider: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="mock"
    )
    model_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="heuristic-v1"
    )
    trace_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        index=True
    )
