import uuid
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.db.models.consent import Consent
    from app.db.models.identity_mapping import IdentityMapping
    from app.db.models.audit_log import AuditLog


class Department(Base, TimestampMixin):
    """
    Government Department record (e.g. Revenue, Land, Education, Welfare, Housing).
    """
    __tablename__ = "departments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )
    code: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True
    )

    # ── Prototype Office Routing Information (Clearly labelled prototype data) ──
    zone: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True
    )
    office_address: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True
    )
    contact_info: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True
    )

    # Relationships
    consents: Mapped[List["Consent"]] = relationship(
        "Consent",
        back_populates="department",
        cascade="all, delete-orphan"
    )
    identity_mappings: Mapped[List["IdentityMapping"]] = relationship(
        "IdentityMapping",
        back_populates="department",
        cascade="all, delete-orphan"
    )
    audit_logs: Mapped[List["AuditLog"]] = relationship(
        "AuditLog",
        back_populates="department"
    )
