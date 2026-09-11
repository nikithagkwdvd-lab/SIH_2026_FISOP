"""
Additive Alembic Migration: Add missing document fields to applications, add office/zone info to departments.
Database: SQLite (fisop_local.db).
NON-DESTRUCTIVE: Only ALTER TABLE ADD COLUMN.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = 'add_missing_document_fields'
down_revision = 'add_decision_and_reapplication_fields'
branch_labels = None
depends_on = None


def upgrade():
    # ── applications table: add 3 new nullable columns ──────────────────────
    with op.batch_alter_table('applications', schema=None) as batch_op:
        batch_op.add_column(sa.Column(
            'waiting_reason',
            sa.String(100),
            nullable=True
        ))
        batch_op.add_column(sa.Column(
            'missing_document_item',
            sa.String(255),
            nullable=True
        ))
        batch_op.add_column(sa.Column(
            'missing_document_dept',
            sa.String(50),
            nullable=True
        ))

    # ── departments table: add 3 new nullable columns ───────────────────────
    with op.batch_alter_table('departments', schema=None) as batch_op:
        batch_op.add_column(sa.Column(
            'zone',
            sa.String(100),
            nullable=True
        ))
        batch_op.add_column(sa.Column(
            'office_address',
            sa.String(500),
            nullable=True
        ))
        batch_op.add_column(sa.Column(
            'contact_info',
            sa.String(255),
            nullable=True
        ))


def downgrade():
    with op.batch_alter_table('departments', schema=None) as batch_op:
        batch_op.drop_column('contact_info')
        batch_op.drop_column('office_address')
        batch_op.drop_column('zone')

    with op.batch_alter_table('applications', schema=None) as batch_op:
        batch_op.drop_column('missing_document_dept')
        batch_op.drop_column('missing_document_item')
        batch_op.drop_column('waiting_reason')
