from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload
from app.models import (
    BookingModel,
    BookedSeatMapModel,
    BookedTicketModel,
    ShowModel,
    ScreenModel,
)
from uuid import UUID


def _with_show_details(query):
    """Eager-load show/movie/theatre/screen details onto a BookingModel query."""
    return query.options(
        selectinload(BookingModel.show).selectinload(ShowModel.movie),
        selectinload(BookingModel.show)
        .selectinload(ShowModel.screen)
        .selectinload(ScreenModel.theatre),
    )


class BookingRepository:
    """Handle database operations related to bookings."""
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_booking_repo(
        self, user_id: UUID, show_id: UUID, seat_array: list[str], total_bill: float
    ) -> BookingModel:
        """Create booking and store selected seats."""
        new_booking = BookingModel(
            user_id=user_id,
            show_id=show_id,
            number_of_seats=len(seat_array),
            total_bill=total_bill,
        )
        self.db.add(new_booking)
        await self.db.flush()

        booked_seats = [
            BookedSeatMapModel(
                seats_number=seat, booking_id=new_booking.id, show_id=show_id
            )
            for seat in seat_array
        ]
        self.db.add_all(booked_seats)
        return new_booking

    async def get_booking_by_id_repo(
        self, booking_id: UUID, user_id: UUID
    ) -> BookingModel | None:
        """Fetch a booking by ID, ensuring it belongs to the user."""
        query = select(BookingModel).where(
            BookingModel.id == booking_id,
            BookingModel.user_id == user_id,
            BookingModel.is_cancelled == False,
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_user_bookings_repo(
        self, user_id: UUID, page: int, size: int
    ) -> list[BookingModel]:
        """Fetch a user's bookings (including cancelled), most recent first."""
        skip = (page - 1) * size
        query = _with_show_details(
            select(BookingModel).where(BookingModel.user_id == user_id)
        ).order_by(BookingModel.created_at.desc()).offset(skip).limit(size)

        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_booking_detail_repo(
        self, booking_id: UUID, user_id: UUID
    ) -> BookingModel | None:
        """Fetch a single booking with seats and show details, for the owning user."""
        query = _with_show_details(
            select(BookingModel).where(
                BookingModel.id == booking_id, BookingModel.user_id == user_id
            )
        ).options(selectinload(BookingModel.booked_seat_list))

        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def cancel_booking_repo(self, booking_id: UUID):
        """Soft-cancel a booking, its booked seats, and invalidate its ticket."""
        await self.db.execute(
            update(BookingModel)
            .where(BookingModel.id == booking_id)
            .values(is_cancelled=True)
        )
        await self.db.execute(
            update(BookedSeatMapModel)
            .where(BookedSeatMapModel.booking_id == booking_id)
            .values(is_cancelled=True)
        )
        await self.db.execute(
            update(BookedTicketModel)
            .where(BookedTicketModel.booking_id == booking_id)
            .values(is_used=True)
        )
