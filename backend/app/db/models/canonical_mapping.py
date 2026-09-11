import uuid
from typing import Optional
from sqlalchemy import String, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class CanonicalMapping(Base, TimestampMixin):
    """
    Stores active, approved production field mappings between legacy/external department schemas
    and canonical fields. Consumed by the deterministic interoperability transformation engine.
    """
    __tablename__ = "canonical_mappings"

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
    source_field: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True
    )
    canonical_field: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True
    )
    source_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )
    canonical_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )
    suggestion_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("ai_mapping_suggestions.id", ondelete="SET NULL"),
        nullable=True
    )
    approved_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        nullable=True
    )
