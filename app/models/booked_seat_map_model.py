from sqlalchemy import ForeignKey, Float, ARRAY, Boolean, Integer, String, Index, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from uuid import UUID
from typing import TYPE_CHECKING


if TYPE_CHECKING:
    from app.models import BookingModel,ShowModel


class BookedSeatMapModel(Base):
    __tablename__ = "booked_seats_map"

    # Mirrors the partial unique index created in migration
    # ff5e487c9228_add_unique_constraint_booked_seats.py. Declared here too so
    # the model/metadata matches the real schema (Base.metadata.create_all,
    # used by the test DB setup, previously omitted this constraint entirely).
    __table_args__ = (
        Index(
            "uq_active_seat_per_show",
            "seats_number",
            "show_id",
            unique=True,
            postgresql_where=text("is_cancelled = false"),
        ),
    )

    seats_number : Mapped[str] = mapped_column(String, nullable=False)
    booking_id : Mapped[UUID] = mapped_column(ForeignKey("bookings.id"), index=True)
    show_id : Mapped[UUID] = mapped_column(ForeignKey("shows.id"), index=True)
    is_cancelled : Mapped[bool] = mapped_column(Boolean, default=False)

    booking : Mapped["BookingModel"] = relationship(back_populates="booked_seat_list")
    show : Mapped["ShowModel"] = relationship(back_populates="booked_seat_list")