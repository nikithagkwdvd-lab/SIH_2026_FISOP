import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional
from sqlalchemy import String, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.db.models.citizen import Citizen
    from app.db.models.department import Department


class ConsentStatus:
    REQUESTED = "REQUESTED"
    GRANTED = "GRANTED"
    DENIED = "DENIED"
    REVOKED = "REVOKED"
    EXPIRED = "EXPIRED"


class Consent(Base, TimestampMixin):
    """
    Citizen Consent registry for data sharing between departments.
    Enables answering: "Did citizen C grant department D access to data type T for purpose P?"
    """
    __tablename__ = "consents"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    citizen_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("citizens.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    department_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("departments.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    data_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True
    )
    purpose: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
        default=ConsentStatus.REQUESTED
    )
    granted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    # Relationships
    citizen: Mapped["Citizen"] = relationship(
        "Citizen",
        back_populates="consents"
    )
    department: Mapped["Department"] = relationship(
        "Department",
        back_populates="consents"
    )

    __table_args__ = (
        Index(
            "idx_consent_lookup",
            "citizen_id",
            "department_id",
            "data_type",
            "purpose"
        ),
    )
