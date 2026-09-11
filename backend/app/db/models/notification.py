import uuid
from typing import TYPE_CHECKING, Optional
from sqlalchemy import String, Text, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.db.models.citizen import Citizen
    from app.db.models.application import Application


class NotificationStatus:
    PENDING = "PENDING"
    SENT = "SENT"
    FAILED = "FAILED"
    READ = "READ"


class Notification(Base, TimestampMixin):
    """
    Notification queue and history sent to citizens regarding applications and consents.
    is_read allows the citizen dashboard to show an unread count and mark items read.
    """
    __tablename__ = "notifications"

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
    application_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("applications.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    type: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )
    message: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
        default=NotificationStatus.PENDING
    )
    # Citizen-side read flag — allows unread badge count on dashboard
    is_read: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="0"  # SQLite-safe: 0=False
    )

    # Relationships
    citizen: Mapped["Citizen"] = relationship(
        "Citizen",
        back_populates="notifications"
    )
    application: Mapped[Optional["Application"]] = relationship(
        "Application",
        back_populates="notifications"
    )
