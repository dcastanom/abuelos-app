"""add author_role to nursing_notes

Revision ID: c3e1dae7e021
Revises: 26c6ae714cf2
Create Date: 2026-07-25 16:44:41.822771

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'c3e1dae7e021'
down_revision: Union[str, Sequence[str], None] = '26c6ae714cf2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('nursing_notes', sa.Column('author_role', sa.String(), nullable=True))
    # Backfill from the users table via nurse_id; if the author's user record
    # no longer exists, default to 'nurse' (the pre-existing, non-privileged
    # assumption) rather than 'admin', so old notes don't suddenly become
    # hidden from nurse/doctor users under the new visibility rule.
    op.execute(
        "UPDATE nursing_notes SET author_role = COALESCE("
        "(SELECT role FROM users WHERE users.id = nursing_notes.nurse_id), 'nurse')"
    )
    with op.batch_alter_table('nursing_notes') as batch_op:
        batch_op.alter_column('author_role', nullable=False)


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('nursing_notes') as batch_op:
        batch_op.drop_column('author_role')
