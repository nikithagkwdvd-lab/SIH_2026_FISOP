import uuid
from datetime import datetime, timezone
from typing import Optional, Any, Dict, List
from sqlalchemy import String, Float, DateTime, ForeignKey, JSON, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, utc_now


class DataQualityResult(Base):
    """
    Deterministic Data Quality Validation Results for Interoperability Responses.
    Stores completeness, validity, overall scores, and structured validation error details.
    """
    __tablename__ = "data_quality_results"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    application_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("applications.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    department: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True
    )
    operation: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True
    )
    completeness_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=100.0
    )
    validity_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=100.0
    )
    overall_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=100.0
    )
    validation_errors: Mapped[Optional[Any]] = mapped_column(
        JSON,
        nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        server_default=func.now(),
        nullable=False,
        index=True
    )
