import uuid
from typing import TYPE_CHECKING
from sqlalchemy import String, ForeignKey, UniqueConstraint, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.db.models.citizen import Citizen
    from app.db.models.department import Department


class IdentityMapping(Base, TimestampMixin):
    """
    Cross-Departmental Identity Mapping table.
    Maps canonical citizen ID (CIT-xxx) to department-specific legacy/siloed identifiers.
    """
    __tablename__ = "identity_mappings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    canonical_citizen_id: Mapped[uuid.UUID] = mapped_column(
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
    department_citizen_id: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True
    )

    # Relationships
    citizen: Mapped["Citizen"] = relationship(
        "Citizen",
        back_populates="identity_mappings"
    )
    department: Mapped["Department"] = relationship(
        "Department",
        back_populates="identity_mappings"
    )

    __table_args__ = (
        UniqueConstraint(
            "department_id",
            "department_citizen_id",
            name="uq_department_citizen_id"
        ),
    )
