"""add_unique_constraint_booked_seats

Revision ID: ff5e487c9228
Revises: a7c51f816b9f
Create Date: 2026-07-26 23:36:27.936368

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ff5e487c9228'
down_revision: Union[str, Sequence[str], None] = 'a7c51f816b9f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(op.f('ix_layouts_theatre_id'), 'layouts', ['theatre_id'], unique=False)
    op.create_index(op.f('ix_screens_layout_id'), 'screens', ['layout_id'], unique=False)
    op.create_index(op.f('ix_screens_theatre_id'), 'screens', ['theatre_id'], unique=False)
    op.execute(
        "CREATE UNIQUE INDEX uq_active_seat_per_show "
        "ON booked_seats_map (seats_number, show_id) "
        "WHERE is_cancelled = false"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS uq_active_seat_per_show")
    op.drop_index(op.f('ix_screens_theatre_id'), table_name='screens')
    op.drop_index(op.f('ix_screens_layout_id'), table_name='screens')
    op.drop_index(op.f('ix_layouts_theatre_id'), table_name='layouts')
