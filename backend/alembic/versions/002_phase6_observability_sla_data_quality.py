"""phase6_observability_sla_data_quality

Revision ID: 002_phase6_observability
Revises: 001_initial_schema
Create Date: 2026-08-31 22:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '002_phase6_observability'
down_revision: Union[str, None] = '001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. API_METRICS
    op.create_table(
        'api_metrics',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('application_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('applications.id', ondelete='CASCADE'), nullable=True),
        sa.Column('workflow_instance_id', sa.String(length=100), nullable=True),
        sa.Column('trace_id', sa.String(length=100), nullable=True),
        sa.Column('department', sa.String(length=50), nullable=False),
        sa.Column('operation', sa.String(length=100), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('http_status', sa.Integer(), nullable=True),
        sa.Column('duration_ms', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('retry_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('error_category', sa.String(length=100), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_api_metrics_application_id'), 'api_metrics', ['application_id'], unique=False)
    op.create_index(op.f('ix_api_metrics_workflow_instance_id'), 'api_metrics', ['workflow_instance_id'], unique=False)
    op.create_index(op.f('ix_api_metrics_trace_id'), 'api_metrics', ['trace_id'], unique=False)
    op.create_index(op.f('ix_api_metrics_department'), 'api_metrics', ['department'], unique=False)
    op.create_index(op.f('ix_api_metrics_operation'), 'api_metrics', ['operation'], unique=False)
    op.create_index(op.f('ix_api_metrics_status'), 'api_metrics', ['status'], unique=False)
    op.create_index(op.f('ix_api_metrics_error_category'), 'api_metrics', ['error_category'], unique=False)
    op.create_index(op.f('ix_api_metrics_created_at'), 'api_metrics', ['created_at'], unique=False)

    # 2. SLA_DEFINITIONS
    op.create_table(
        'sla_definitions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('operation', sa.String(length=100), nullable=False),
        sa.Column('department', sa.String(length=50), nullable=True),
        sa.Column('limit_ms', sa.Float(), nullable=False),
        sa.Column('active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_sla_definitions_operation'), 'sla_definitions', ['operation'], unique=True)
    op.create_index(op.f('ix_sla_definitions_department'), 'sla_definitions', ['department'], unique=False)

    # 3. SLA_RECORDS
    op.create_table(
        'sla_records',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('application_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('applications.id', ondelete='CASCADE'), nullable=True),
        sa.Column('workflow_instance_id', sa.String(length=100), nullable=True),
        sa.Column('operation', sa.String(length=100), nullable=False),
        sa.Column('department', sa.String(length=50), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('duration_ms', sa.Float(), nullable=False),
        sa.Column('sla_limit_ms', sa.Float(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_sla_records_application_id'), 'sla_records', ['application_id'], unique=False)
    op.create_index(op.f('ix_sla_records_workflow_instance_id'), 'sla_records', ['workflow_instance_id'], unique=False)
    op.create_index(op.f('ix_sla_records_operation'), 'sla_records', ['operation'], unique=False)
    op.create_index(op.f('ix_sla_records_department'), 'sla_records', ['department'], unique=False)
    op.create_index(op.f('ix_sla_records_status'), 'sla_records', ['status'], unique=False)

    # 4. DATA_QUALITY_RESULTS
    op.create_table(
        'data_quality_results',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('application_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('applications.id', ondelete='CASCADE'), nullable=True),
        sa.Column('department', sa.String(length=50), nullable=False),
        sa.Column('operation', sa.String(length=100), nullable=False),
        sa.Column('completeness_score', sa.Float(), nullable=False, server_default='100.0'),
        sa.Column('validity_score', sa.Float(), nullable=False, server_default='100.0'),
        sa.Column('overall_score', sa.Float(), nullable=False, server_default='100.0'),
        sa.Column('validation_errors', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_data_quality_results_application_id'), 'data_quality_results', ['application_id'], unique=False)
    op.create_index(op.f('ix_data_quality_results_department'), 'data_quality_results', ['department'], unique=False)
    op.create_index(op.f('ix_data_quality_results_operation'), 'data_quality_results', ['operation'], unique=False)
    op.create_index(op.f('ix_data_quality_results_created_at'), 'data_quality_results', ['created_at'], unique=False)


def downgrade() -> None:
    op.drop_table('data_quality_results')
    op.drop_table('sla_records')
    op.drop_table('sla_definitions')
    op.drop_table('api_metrics')
