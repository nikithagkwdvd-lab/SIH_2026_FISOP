from datetime import datetime, timezone
from sqlalchemy import DateTime, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    """
    Base declarative class for all SQLAlchemy 2.x models in the interoperability platform.
    """
    pass

def utc_now() -> datetime:
    """Helper to return explicit timezone-aware UTC datetime."""
    return datetime.now(timezone.utc)

class TimestampMixin:
    """
    Mixin providing timezone-aware created_at and updated_at fields.
    Uses PostgreSQL timezone-aware timestamps (TIMESTAMP WITH TIME ZONE).
    """
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        server_default=func.now(),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        server_default=func.now(),
        onupdate=utc_now,
        nullable=False
    )
