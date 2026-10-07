"""add bio to users

Revision ID: cf196db84e0d
Revises: c792e8e66f33
Create Date: 2026-10-01 19:44:14.421216

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'cf196db84e0d'
down_revision: Union[str, Sequence[str], None] = 'c792e8e66f33'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column('bio', sa.Text(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('users', 'bio')
