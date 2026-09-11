import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Integer, Float, Boolean, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, utc_now


class SlaStatus:
    SLA_MET = "SLA_MET"
    SLA_BREACHED = "SLA_BREACHED"


class SlaDefinition(Base):
    """
    Configurable Service Level Agreement Limits per Department/Operation.
    """
    __tablename__ = "sla_definitions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    operation: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        unique=True,
        index=True
    )
    department: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        index=True
    )
    limit_ms: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )
    active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        server_default=func.now(),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
        nullable=False
    )


class SlaRecord(Base):
    """
    SLA Execution Tracking Record per Application / Operation.
    """
    __tablename__ = "sla_records"

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
    workflow_instance_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        index=True
    )
    operation: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True
    )
    department: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        index=True
    )
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False
    )
    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False
    )
    duration_ms: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )
    sla_limit_ms: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
        default=SlaStatus.SLA_MET
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        server_default=func.now(),
        nullable=False,
        index=True
    )
