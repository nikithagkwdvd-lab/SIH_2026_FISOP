import uuid
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.db.models.application import Application
    from app.db.models.consent import Consent
    from app.db.models.identity_mapping import IdentityMapping
    from app.db.models.notification import Notification


class Citizen(Base, TimestampMixin):
    """
    Central Canonical Citizen record in the Interoperability Platform.
    Stores core identity attributes without leaking sensitive departmental data.
    """
    __tablename__ = "citizens"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )
    email: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        index=True
    )
    phone: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True
    )

    # Relationships
    applications: Mapped[List["Application"]] = relationship(
        "Application",
        back_populates="citizen",
        cascade="all, delete-orphan"
    )
    consents: Mapped[List["Consent"]] = relationship(
        "Consent",
        back_populates="citizen",
        cascade="all, delete-orphan"
    )
    identity_mappings: Mapped[List["IdentityMapping"]] = relationship(
        "IdentityMapping",
        back_populates="citizen",
        cascade="all, delete-orphan"
    )
    notifications: Mapped[List["Notification"]] = relationship(
        "Notification",
        back_populates="citizen",
        cascade="all, delete-orphan"
    )
