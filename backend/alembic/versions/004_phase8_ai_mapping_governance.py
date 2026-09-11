"""phase8_ai_mapping_governance

Revision ID: 004_phase8_ai_governance
Revises: 003_phase7_resilience
Create Date: 2026-09-01 15:50:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '004_phase8_ai_governance'
down_revision: Union[str, None] = '003_phase7_resilience'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create ai_mapping_suggestions table
    op.create_table(
        'ai_mapping_suggestions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('department', sa.String(length=100), nullable=False),
        sa.Column('schema_version', sa.String(length=50), nullable=False, server_default='1.0'),
        sa.Column('source_field', sa.String(length=100), nullable=False),
        sa.Column('source_type', sa.String(length=50), nullable=False),
        sa.Column('source_description', sa.Text(), nullable=True),
        sa.Column('canonical_field', sa.String(length=100), nullable=False),
        sa.Column('canonical_type', sa.String(length=50), nullable=False),
        sa.Column('confidence_score', sa.Float(), nullable=False),
        sa.Column('confidence_category', sa.String(length=20), nullable=False, server_default='MEDIUM'),
        sa.Column('reason', sa.Text(), nullable=False),
        sa.Column('evidence', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('candidate_fields', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('requires_human_approval', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='SUGGESTED'),
        sa.Column('reviewed_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('rejection_reason', sa.Text(), nullable=True),
        sa.Column('model_provider', sa.String(length=50), nullable=False, server_default='mock'),
        sa.Column('model_name', sa.String(length=100), nullable=False, server_default='heuristic-v1'),
        sa.Column('trace_id', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )
    op.create_index('ix_ai_mapping_suggestions_department', 'ai_mapping_suggestions', ['department'])
    op.create_index('ix_ai_mapping_suggestions_source_field', 'ai_mapping_suggestions', ['source_field'])
    op.create_index('ix_ai_mapping_suggestions_canonical_field', 'ai_mapping_suggestions', ['canonical_field'])
    op.create_index('ix_ai_mapping_suggestions_status', 'ai_mapping_suggestions', ['status'])
    op.create_index('ix_ai_mapping_suggestions_trace_id', 'ai_mapping_suggestions', ['trace_id'])

    # 2. Create canonical_mappings table
    op.create_table(
        'canonical_mappings',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('department', sa.String(length=100), nullable=False),
        sa.Column('source_field', sa.String(length=100), nullable=False),
        sa.Column('canonical_field', sa.String(length=100), nullable=False),
        sa.Column('source_type', sa.String(length=50), nullable=False),
        sa.Column('canonical_type', sa.String(length=50), nullable=False),
        sa.Column('suggestion_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('ai_mapping_suggestions.id', ondelete='SET NULL'), nullable=True),
        sa.Column('approved_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )
    op.create_index('ix_canonical_mappings_department', 'canonical_mappings', ['department'])
    op.create_index('ix_canonical_mappings_source_field', 'canonical_mappings', ['source_field'])
    op.create_index('ix_canonical_mappings_canonical_field', 'canonical_mappings', ['canonical_field'])


def downgrade() -> None:
    op.drop_table('canonical_mappings')
    op.drop_table('ai_mapping_suggestions')
