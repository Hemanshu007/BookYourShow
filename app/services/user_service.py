from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError
from app.core.redis_config import Redis
from app.repositories.movie_repository import MovieRepository
from app.repositories.theatre_repository import TheatreRepository
from app.repositories.booking_repository import BookingRepository
from app.repositories.user_repository import UserRepository
from app.repositories.booked_ticket_repository import BookingTicketRepository

from app.repositories.show_repository import ShowRepository
from app.services.seat_layout_service import SeatLayoutService
from app.schemas.movie_schema import MovieOutSchema
from app.schemas.theatre_schema import TheatreOutSchema
from app.schemas.standard_schema import ResponseSchema, create_response
from app.schemas.show_schema import ShowDetailOutSchema
from app.schemas.booking_schema import BookingOutSchema, BookingDetailOutSchema
from app.schemas.user_schema import UserOutSchema
from fastapi import status, HTTPException
from app.services.email_service import EmailService

from app.utils.helper import encrypt_data

from uuid import UUID


class UserService:
    """Handle user related operations."""

    def __init__(
        self,
        db: AsyncSession,
        redis: Redis,
        movie_repo: MovieRepository,
        theatre_repo: TheatreRepository,
        show_repo: ShowRepository,
        booking_repo: BookingRepository,
        user_repo: UserRepository,
        booked_ticket_repo: BookingTicketRepository,
        email_service: EmailService
    ):
        self.db = db
        self.redis = redis
        self.movie_repo = movie_repo
        self.theatre_repo = theatre_repo
        self.show_repo = show_repo
        self.booking_repo = booking_repo
        self.user_repo = user_repo
        self.booked_ticket_repo = booked_ticket_repo
        self.email_service = email_service

    async def get_all_movies_service(
        self, page: int = 1, size: int = 10
    ) -> ResponseSchema:
        """Fetch the paginated movie catalog."""
        async with self.db.begin():
            self.movie_repo.db = self.db
            movies = await self.movie_repo.get_all_movies(page=page, size=size)

        movies_data = [
            MovieOutSchema.model_validate(movie).model_dump(mode="json")
            for movie in movies
        ]
        return create_response(
            data=movies_data, message="Movies fetched successfully"
        )

    async def get_movies_by_theatre_service(
        self, theatre_id: str, page: int = 1, size: int = 10
    ) -> ResponseSchema:
        """Fetch movies running in a theatre."""
        async with self.db.begin():
            self.movie_repo.db = self.db
            movies = await self.movie_repo.get_movies_by_theatre_repo(
                theatre_id=theatre_id, page=page, size=size
            )

        movies_data = [
            MovieOutSchema.model_validate(movie).model_dump(mode="json")
            for movie in movies
        ]
        return create_response(
            data=movies_data,
            message="Movies for the specified theatre fetched successfully",
        )

    async def get_theatres_by_movie_service(
        self, movie_id: str, page: int = 1, size: int = 10
    ) -> ResponseSchema:
        """Fetch theatres showing a movie."""
        async with self.db.begin():
            self.theatre_repo.db = self.db
            theatres = await self.theatre_repo.get_theatres_by_movie_repo(
                movie_id=movie_id, page=page, size=size
            )

        theatres_data = [
            TheatreOutSchema.model_validate(theatre).model_dump(mode="json")
            for theatre in theatres
        ]
        return create_response(
            data=theatres_data,
            message="Theatres screening this movie fetched successfully",
        )

    async def get_shows_service(
        self, theatre_id: str, movie_id: str, page: int = 1, size: int = 10
    ) -> ResponseSchema:
        """Fetch shows for a movie in a theatre."""
        async with self.db.begin():
            self.show_repo.db = self.db
            shows = await self.show_repo.get_shows_repo(
                theatre_id=theatre_id, movie_id=movie_id, page=page, size=size
            )

        shows_data = [
            ShowDetailOutSchema.model_validate(show).model_dump(mode="json")
            for show in shows
        ]

        return create_response(
            data=shows_data,
            message="Available shows for this movie and theatre fetched successfully",
        )

    async def get_show_details_service(
        self, show_id: str, seat_layout_service: SeatLayoutService
    ) -> ResponseSchema:
        """Fetch show details with seat layout."""
        async with self.db.begin():
            self.show_repo.db = self.db
            show = await self.show_repo.get_show_by_id_repo(
                show_id=show_id,
                seat_layout_service=seat_layout_service,
            )

            if not show:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Show not found or unavailable",
                )

        return create_response(data=show, message="Show details fetched successfully")

    async def _get_layout(self, show_id: str, seat_layout_service: SeatLayoutService):
        """Fetch or generate seat layout for a show."""
        layout_body = await self.redis.json().get(f"show_seat_layout_{show_id}")

        if not layout_body:
            async with self.db.begin():
                seat_layout_service.db = self.db
                layout_body = await seat_layout_service.generate_show_layout(
                    show_id=show_id
                )

        if not layout_body:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Layout not found"
            )
        return layout_body

    def _get_seat_info(self, layout_body: dict, seat_id: str):
        """Fetch seat position and price from layout."""
        mapping = layout_body.get("seat_mapping", {})
        layout = layout_body.get("layout", [])

        if seat_id not in mapping:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Seat {seat_id} not found",
            )

        row, col = mapping[seat_id]
        seat_data = layout[row][col]
        return row, col, seat_data.get("price", 0)

    async def lock_seat_service(
        self,
        show_id: str,
        user_id: str,
        seat_array: list,
        seat_layout_service: SeatLayoutService,
    ):
        """Lock selected seats for a show."""
        layout_body = await self._get_layout(show_id, seat_layout_service)

        for seat in seat_array:
            row, col, _ = self._get_seat_info(layout_body, seat)
            is_available = (
                layout_body["layout"][row][col].get("status") == "Available"
            )
            if not is_available:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Seat {seat} is unavailable",
                )

        lock_key = f"show_seat_locked_{show_id}"

        async with self.redis.pipeline(transaction=True) as pipe:
            for seat in seat_array:
                pipe.hsetnx(lock_key, seat, user_id)

            results = await pipe.execute()

        # hsetnx returns False both when someone else holds the seat and when
        # the requesting user already holds it themselves (e.g. a retry after
        # a page refresh) — those aren't conflicts and must not be rejected.
        newly_locked = [seat for seat, ok in zip(seat_array, results) if ok]
        already_set = [seat for seat, ok in zip(seat_array, results) if not ok]

        conflicts = []
        if already_set:
            holders = await self.redis.hmget(lock_key, already_set)
            conflicts = [
                seat for seat, holder in zip(already_set, holders) if holder != user_id
            ]

        if conflicts:
            # Only roll back seats this call just claimed — deleting the
            # whole requested batch would also release seats a *different*
            # user legitimately locked before this request ever arrived.
            if newly_locked:
                await self.redis.hdel(lock_key, *newly_locked)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Seats {conflicts} are locked by another user",
            )

        await self.redis.expire(lock_key, 600)
        return create_response(message="Seats Locked Successfully")

    async def book_ticket_service(self, show_id: str, user_id: str, seat_array: list):
        """Book locked seats and create booking."""
        locked_seats = await self.redis.hgetall(f"show_seat_locked_{show_id}")
        for seat in seat_array:
            if locked_seats.get(seat) != user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Seat {seat} lock expired or invalid",
                )

        layout_body = await self.redis.json().get(f"show_seat_layout_{show_id}")
        total_bill = 0
        for seat in seat_array:
            _, _, price = self._get_seat_info(layout_body, seat)
            total_bill += price

        try:
            async with self.db.begin():
                self.show_repo.db = self.db
                self.booking_repo.db = self.db

                for seat in seat_array:
                    result = await self.db.execute(
                        text(
                            "SELECT id FROM booked_seats_map "
                            "WHERE show_id = :show_id AND seats_number = :seat "
                            "AND is_cancelled = false"
                        ),
                        {"show_id": show_id, "seat": seat},
                    )
                    if result.fetchone():
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Seat {seat} is already booked by another user",
                        )

                booking = await self.booking_repo.create_booking_repo(
                    user_id=UUID(user_id),
                    show_id=UUID(show_id),
                    seat_array=seat_array,
                    total_bill=total_bill,
                )

                booking_id = booking.id

                show_end_time = await self.show_repo.get_show_end_time(
                    show_id=show_id
                )

                ticket_hash = await encrypt_data(data=str(booking_id))

                ticket = await self.booked_ticket_repo.create_booking_ticket(
                    booking_id=booking_id,
                    expired_time=show_end_time,
                    ticket_hash=ticket_hash
                )

                user = await self.user_repo.get_user_by_id(
                    user_id=user_id
                )
        except IntegrityError:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="One or more selected seats were just booked by another user",
            )

        await self.email_service.send_qr_ticket(
            email_to=user.email,
            ticket_hash=ticket_hash
        )

        if layout_body:
            for seat in seat_array:
                row, col, _ = self._get_seat_info(layout_body, seat)
                layout_body["layout"][row][col]["status"] = "Booked"

            async with self.redis.pipeline(transaction=True) as pipe:
                pipe.json().set(f"show_seat_layout_{show_id}", "$", layout_body)
                pipe.hdel(f"show_seat_locked_{show_id}", *seat_array)
                await pipe.execute()

        return create_response(
            message="Tickets Booked Successfully",
            data={"booking_id": str(booking.id), "total_paid": total_bill},
        )

    async def get_current_user_service(self, user_id: str) -> ResponseSchema:
        """Fetch the profile of the currently authenticated user."""
        async with self.db.begin():
            self.user_repo.db = self.db
            user = await self.user_repo.get_user_profile_repo(user_id=user_id)

        user_data = UserOutSchema.model_validate(user).model_dump(mode="json")
        return create_response(data=user_data, message="User profile fetched successfully")

    @staticmethod
    def _booking_to_dict(booking) -> dict:
        return {
            "id": booking.id,
            "show_id": booking.show_id,
            "total_bill": booking.total_bill,
            "number_of_seats": booking.number_of_seats,
            "is_cancelled": booking.is_cancelled,
            "movie_name": booking.show.movie.name,
            "theatre_name": booking.show.screen.theatre.name,
            "screen_name": booking.show.screen.name,
            "show_time": booking.show.start_time,
        }

    async def get_user_bookings_service(
        self, user_id: str, page: int = 1, size: int = 10
    ) -> ResponseSchema:
        """Fetch the current user's booking history, most recent first."""
        async with self.db.begin():
            self.booking_repo.db = self.db
            bookings = await self.booking_repo.get_user_bookings_repo(
                user_id=UUID(user_id), page=page, size=size
            )

            bookings_data = [
                BookingOutSchema(**self._booking_to_dict(booking)).model_dump(
                    mode="json"
                )
                for booking in bookings
            ]

        return create_response(
            data=bookings_data, message="Bookings fetched successfully"
        )

    async def get_booking_detail_service(
        self, booking_id: str, user_id: str
    ) -> ResponseSchema:
        """Fetch full details of a single booking belonging to the user."""
        async with self.db.begin():
            self.booking_repo.db = self.db
            booking = await self.booking_repo.get_booking_detail_repo(
                booking_id=UUID(booking_id), user_id=UUID(user_id)
            )

            if not booking:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Booking not found",
                )

            booking_data = BookingDetailOutSchema(
                **self._booking_to_dict(booking),
                seats=[seat.seats_number for seat in booking.booked_seat_list],
            ).model_dump(mode="json")

        return create_response(
            data=booking_data, message="Booking details fetched successfully"
        )

    async def delete_user_service(self, user_id: str):
        """Delete user account."""
        async with self.db.begin():
            self.user_repo.db = self.db

            await self.user_repo.delete_user_repo(user_id=user_id)

        return create_response(message="User deleted successfully")

    async def cancel_booking_service(
        self, booking_id: str, user_id: str
    ) -> ResponseSchema:
        """Cancel a booking and free the seats in Redis."""
        async with self.db.begin():
            self.booking_repo.db = self.db

            booking = await self.booking_repo.get_booking_by_id_repo(
                booking_id=UUID(booking_id), user_id=UUID(user_id)
            )

            if not booking:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Booking not found or already cancelled",
                )

            await self.booking_repo.cancel_booking_repo(booking_id=booking.id)

            show_id = str(booking.show_id)
            booked_seats = [
                seat.seats_number for seat in booking.booked_seat_list
            ]

        if booked_seats:
            await self.redis.hdel(
                f"show_seat_locked_{show_id}", *booked_seats
            )

            layout_body = await self.redis.json().get(
                f"show_seat_layout_{show_id}"
            )
            if layout_body:
                for seat in booked_seats:
                    seat_info = self._get_seat_info(layout_body, seat)
                    row, col, _ = seat_info
                    layout_body["layout"][row][col]["status"] = "Available"

                await self.redis.json().set(
                    f"show_seat_layout_{show_id}", "$", layout_body
                )

        return create_response(message="Booking cancelled successfully")
