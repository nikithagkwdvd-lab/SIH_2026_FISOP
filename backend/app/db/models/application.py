import uuid
import json
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import String, ForeignKey, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.db.models.citizen import Citizen
    from app.db.models.workflow_instance import WorkflowInstance
    from app.db.models.notification import Notification


class ApplicationStatus:
    SUBMITTED = "SUBMITTED"
    VALIDATING = "VALIDATING"
    CONSENT_CHECK = "CONSENT_CHECK"
    IDENTITY_RESOLUTION = "IDENTITY_RESOLUTION"
    REVENUE_VERIFICATION = "REVENUE_VERIFICATION"
    LAND_VERIFICATION = "LAND_VERIFICATION"
    WELFARE_VERIFICATION = "WELFARE_VERIFICATION"
    ELIGIBILITY_EVALUATION = "ELIGIBILITY_EVALUATION"
    WAITING_FOR_DEPARTMENT = "WAITING_FOR_DEPARTMENT"
    MANUAL_REVIEW = "MANUAL_REVIEW"
    IN_VERIFICATION = "IN_VERIFICATION"
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    FAILED = "FAILED"


class Application(Base, TimestampMixin):
    """
    Application for government services submitted by citizens.

    Decision fields (rejection_reason, officer_remarks, affected_fields,
    decision_by, decision_at) are populated when an officer approves/rejects.

    application_data (JSON text) stores the submitted form payload so that
    ReapplyPage can pre-fill valid fields on a new application.

    parent_application_id links a reapplication back to its original rejected
    application without modifying that original record.
    """
    __tablename__ = "applications"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    application_number: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True
    )
    citizen_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("citizens.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    service_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True
    )
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
        default=ApplicationStatus.SUBMITTED
    )
    idempotency_key: Mapped[Optional[str]] = mapped_column(
        String(100),
        unique=True,
        nullable=True,
        index=True
    )

    # ── Decision fields — persisted by WorkflowService.manual_review() ────────
    rejection_reason: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True
    )
    officer_remarks: Mapped[Optional[str]] = mapped_column(
        String(1000),
        nullable=True
    )
    # JSON-encoded list: ["annualIncome", "incomeSource"] — SQLite-safe TEXT
    affected_fields: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    # Department code or actor username of the deciding officer
    decision_by: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True
    )
    # ISO-format timestamp of the decision — stored as string for SQLite compat
    decision_at: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True
    )

    # ── Reapplication link ─────────────────────────────────────────────────────
    # UUID string of the original rejected application (preserves history)
    parent_application_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        nullable=True,
        index=True
    )

    # ── Submitted form payload — JSON text (SQLite-safe) ──────────────────────
    # Stored at submission time; used by ReapplyPage to pre-fill valid fields.
    # Must NOT contain passwords, JWTs, OTPs, or authentication credentials.
    application_data: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )

    # ── Missing document / Data availability fields ───────────────────────────
    # DOCUMENT_NOT_FOUND | DEPT_UNAVAILABLE | None
    waiting_reason: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True
    )
    # Human-readable label of the missing document (e.g. "Income Verification Record")
    missing_document_item: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True
    )
    # Department code responsible for issuing the document (e.g. "REV", "LAND", "WEL")
    missing_document_dept: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True
    )

    # Relationships
    citizen: Mapped["Citizen"] = relationship(
        "Citizen",
        back_populates="applications"
    )
    workflow_instances: Mapped[List["WorkflowInstance"]] = relationship(
        "WorkflowInstance",
        back_populates="application",
        cascade="all, delete-orphan"
    )
    notifications: Mapped[List["Notification"]] = relationship(
        "Notification",
        back_populates="application"
    )
