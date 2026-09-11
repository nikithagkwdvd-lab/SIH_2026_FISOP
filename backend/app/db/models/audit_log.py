import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional
from sqlalchemy import String, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, utc_now

if TYPE_CHECKING:
    from app.db.models.department import Department


class AuditAction:
    VIEW_CITIZEN = "VIEW_CITIZEN"
    REQUEST_INCOME = "REQUEST_INCOME"
    REQUEST_PROPERTY = "REQUEST_PROPERTY"
    GRANT_CONSENT = "GRANT_CONSENT"
    REVOKE_CONSENT = "REVOKE_CONSENT"
    APPROVE_APPLICATION = "APPROVE_APPLICATION"
    REJECT_APPLICATION = "REJECT_APPLICATION"
    LOGIN_SUCCESS = "LOGIN_SUCCESS"
    LOGIN_FAILURE = "LOGIN_FAILURE"
    ACCESS_GRANTED = "ACCESS_GRANTED"
    ACCESS_DENIED = "ACCESS_DENIED"
    CONSENT_GRANTED = "CONSENT_GRANTED"
    CONSENT_DENIED = "CONSENT_DENIED"
    DATA_REQUEST = "DATA_REQUEST"
    DATA_ACCESS_FAILURE = "DATA_ACCESS_FAILURE"


class AuditLog(Base):
    """
    Immutable Audit Log for compliance and access tracking across government departments.
    Does NOT store sensitive payloads. Stores metadata, actor identity, action type, and trace IDs.
    """
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    actor_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
        index=True
    )
    department_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("departments.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    action: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True
    )
    resource_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )
    resource_id: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        index=True
    )
    purpose: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True
    )
    result: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )
    trace_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        server_default=func.now(),
        nullable=False,
        index=True
    )

    # Relationships
    department: Mapped[Optional["Department"]] = relationship(
        "Department",
        back_populates="audit_logs"
    )
