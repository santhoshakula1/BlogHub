"""add case insensitive unique indexes

Revision ID: 8e00b6317221
Revises: bbdab501ab93
Create Date: 2026-10-22 09:27:51.230009

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8e00b6317221'
down_revision: Union[str, Sequence[str], None] = 'bbdab501ab93'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # "Alice" and "alice" must count as the SAME name, so the database
    # itself compares the lowercase versions. This also protects us when
    # two requests arrive at the same moment.
    op.create_index(
        "uq_users_username_lower",
        "users",
        [sa.text("lower(username)")],
        unique=True,
    )
    op.create_index(
        "uq_users_email_lower",
        "users",
        [sa.text("lower(email)")],
        unique=True,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("uq_users_email_lower", table_name="users")
    op.drop_index("uq_users_username_lower", table_name="users")