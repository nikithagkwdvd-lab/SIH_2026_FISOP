"""initial_schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-08-28 19:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. CITIZENS
    op.create_table(
        'citizens',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_citizens_email'), 'citizens', ['email'], unique=False)

    # 2. DEPARTMENTS
    op.create_table(
        'departments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_departments_code'), 'departments', ['code'], unique=True)

    # 3. APPLICATIONS
    op.create_table(
        'applications',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('application_number', sa.String(length=100), nullable=False),
        sa.Column('citizen_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('citizens.id', ondelete='CASCADE'), nullable=False),
        sa.Column('service_type', sa.String(length=100), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_applications_application_number'), 'applications', ['application_number'], unique=True)
    op.create_index(op.f('ix_applications_citizen_id'), 'applications', ['citizen_id'], unique=False)
    op.create_index(op.f('ix_applications_service_type'), 'applications', ['service_type'], unique=False)
    op.create_index(op.f('ix_applications_status'), 'applications', ['status'], unique=False)

    # 4. CONSENTS
    op.create_table(
        'consents',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('citizen_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('citizens.id', ondelete='CASCADE'), nullable=False),
        sa.Column('department_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('departments.id', ondelete='CASCADE'), nullable=False),
        sa.Column('data_type', sa.String(length=100), nullable=False),
        sa.Column('purpose', sa.String(length=255), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('granted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_consents_citizen_id'), 'consents', ['citizen_id'], unique=False)
    op.create_index(op.f('ix_consents_department_id'), 'consents', ['department_id'], unique=False)
    op.create_index(op.f('ix_consents_data_type'), 'consents', ['data_type'], unique=False)
    op.create_index(op.f('ix_consents_status'), 'consents', ['status'], unique=False)
    op.create_index('idx_consent_lookup', 'consents', ['citizen_id', 'department_id', 'data_type', 'purpose'], unique=False)

    # 5. IDENTITY_MAPPINGS
    op.create_table(
        'identity_mappings',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('canonical_citizen_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('citizens.id', ondelete='CASCADE'), nullable=False),
        sa.Column('department_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('departments.id', ondelete='CASCADE'), nullable=False),
        sa.Column('department_citizen_id', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.UniqueConstraint('department_id', 'department_citizen_id', name='uq_department_citizen_id')
    )
    op.create_index(op.f('ix_identity_mappings_canonical_citizen_id'), 'identity_mappings', ['canonical_citizen_id'], unique=False)
    op.create_index(op.f('ix_identity_mappings_department_id'), 'identity_mappings', ['department_id'], unique=False)
    op.create_index(op.f('ix_identity_mappings_department_citizen_id'), 'identity_mappings', ['department_citizen_id'], unique=False)

    # 6. WORKFLOW_INSTANCES
    op.create_table(
        'workflow_instances',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('application_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('applications.id', ondelete='CASCADE'), nullable=False),
        sa.Column('workflow_name', sa.String(length=100), nullable=False),
        sa.Column('workflow_instance_id', sa.String(length=100), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_workflow_instances_application_id'), 'workflow_instances', ['application_id'], unique=False)
    op.create_index(op.f('ix_workflow_instances_workflow_instance_id'), 'workflow_instances', ['workflow_instance_id'], unique=False)
    op.create_index(op.f('ix_workflow_instances_status'), 'workflow_instances', ['status'], unique=False)

    # 7. AUDIT_LOGS
    op.create_table(
        'audit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('actor_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('department_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('departments.id', ondelete='SET NULL'), nullable=True),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('resource_type', sa.String(length=100), nullable=False),
        sa.Column('resource_id', sa.String(length=255), nullable=True),
        sa.Column('purpose', sa.String(length=255), nullable=True),
        sa.Column('result', sa.String(length=50), nullable=False),
        sa.Column('trace_id', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_audit_logs_actor_id'), 'audit_logs', ['actor_id'], unique=False)
    op.create_index(op.f('ix_audit_logs_department_id'), 'audit_logs', ['department_id'], unique=False)
    op.create_index(op.f('ix_audit_logs_action'), 'audit_logs', ['action'], unique=False)
    op.create_index(op.f('ix_audit_logs_resource_id'), 'audit_logs', ['resource_id'], unique=False)
    op.create_index(op.f('ix_audit_logs_created_at'), 'audit_logs', ['created_at'], unique=False)

    # 8. NOTIFICATIONS
    op.create_table(
        'notifications',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('citizen_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('citizens.id', ondelete='CASCADE'), nullable=False),
        sa.Column('application_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('applications.id', ondelete='SET NULL'), nullable=True),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_notifications_citizen_id'), 'notifications', ['citizen_id'], unique=False)
    op.create_index(op.f('ix_notifications_application_id'), 'notifications', ['application_id'], unique=False)
    op.create_index(op.f('ix_notifications_status'), 'notifications', ['status'], unique=False)


def downgrade() -> None:
    op.drop_table('notifications')
    op.drop_table('audit_logs')
    op.drop_table('workflow_instances')
    op.drop_table('identity_mappings')
    op.drop_table('consents')
    op.drop_table('applications')
    op.drop_table('departments')
    op.drop_table('citizens')
