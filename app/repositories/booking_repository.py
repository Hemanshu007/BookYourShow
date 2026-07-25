from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.models import BookingModel, BookedSeatMapModel
from uuid import UUID


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

    async def cancel_booking_repo(self, booking_id: UUID):
        """Soft-cancel a booking and its booked seats."""
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
