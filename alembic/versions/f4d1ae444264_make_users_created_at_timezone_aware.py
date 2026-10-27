"""make users created_at timezone aware

Revision ID: f4d1ae444264
Revises: 8e00b6317221
Create Date: 2026-10-27 12:03:46.452262

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f4d1ae444264'
down_revision: Union[str, Sequence[str], None] = '8e00b6317221'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # The old column stored a plain clock time with NO timezone. PostgreSQL
    # wrote it using the database server's own timezone, so we read the old
    # values back with that same timezone: current_setting('TimeZone').
    # Result: every existing date keeps pointing at the same real moment.
    op.alter_column(
        "users",
        "created_at",
        existing_type=sa.DateTime(),
        type_=sa.DateTime(timezone=True),
        existing_nullable=True,
        postgresql_using="created_at AT TIME ZONE current_setting('TimeZone')",
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column(
        "users",
        "created_at",
        existing_type=sa.DateTime(timezone=True),
        type_=sa.DateTime(),
        existing_nullable=True,
        postgresql_using="created_at AT TIME ZONE current_setting('TimeZone')",
    )
