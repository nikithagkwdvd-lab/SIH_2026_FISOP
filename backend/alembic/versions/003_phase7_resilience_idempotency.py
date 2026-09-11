"""phase7_resilience_idempotency

Revision ID: 003_phase7_resilience
Revises: 002_phase6_observability
Create Date: 2026-08-31 22:50:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '003_phase7_resilience'
down_revision: Union[str, None] = '002_phase6_observability'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('applications', sa.Column('idempotency_key', sa.String(length=100), nullable=True))
    op.create_index(op.f('ix_applications_idempotency_key'), 'applications', ['idempotency_key'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_applications_idempotency_key'), table_name='applications')
    op.drop_column('applications', 'idempotency_key')
