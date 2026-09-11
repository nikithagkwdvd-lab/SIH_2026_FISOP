"""
Additive Alembic Migration: Add decision fields, application_data, parent link to applications.
Add is_read to notifications.
Database: SQLite (fisop_local.db).
NON-DESTRUCTIVE: Only ALTER TABLE ADD COLUMN.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = 'add_decision_and_reapplication_fields'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # ── applications table: add 7 new nullable columns ──────────────────────
    with op.batch_alter_table('applications', schema=None) as batch_op:
        batch_op.add_column(sa.Column(
            'rejection_reason',
            sa.String(500),
            nullable=True
        ))
        batch_op.add_column(sa.Column(
            'officer_remarks',
            sa.String(1000),
            nullable=True
        ))
        # stored as JSON text (SQLite-safe)
        batch_op.add_column(sa.Column(
            'affected_fields',
            sa.Text(),
            nullable=True
        ))
        batch_op.add_column(sa.Column(
            'decision_by',
            sa.String(100),
            nullable=True
        ))
        batch_op.add_column(sa.Column(
            'decision_at',
            sa.DateTime(timezone=True),
            nullable=True
        ))
        batch_op.add_column(sa.Column(
            'parent_application_id',
            sa.String(36),  # UUID stored as string, SQLite-safe
            nullable=True
        ))
        # JSON text blob of submitted form data
        batch_op.add_column(sa.Column(
            'application_data',
            sa.Text(),
            nullable=True
        ))

    # ── notifications table: add is_read column ──────────────────────────────
    with op.batch_alter_table('notifications', schema=None) as batch_op:
        batch_op.add_column(sa.Column(
            'is_read',
            sa.Boolean(),
            nullable=False,
            server_default=sa.text('0')  # SQLite: 0=False
        ))


def downgrade():
    # Reverse: remove added columns (SQLite batch mode required)
    with op.batch_alter_table('notifications', schema=None) as batch_op:
        batch_op.drop_column('is_read')

    with op.batch_alter_table('applications', schema=None) as batch_op:
        batch_op.drop_column('application_data')
        batch_op.drop_column('parent_application_id')
        batch_op.drop_column('decision_at')
        batch_op.drop_column('decision_by')
        batch_op.drop_column('affected_fields')
        batch_op.drop_column('officer_remarks')
        batch_op.drop_column('rejection_reason')
