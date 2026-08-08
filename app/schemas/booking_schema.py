from pydantic import BaseModel
from datetime import datetime
from uuid import UUID


class BookingOutSchema(BaseModel):
    id: UUID
    show_id: UUID
    total_bill: float
    number_of_seats: int
    is_cancelled: bool
    movie_name: str
    theatre_name: str
    screen_name: str
    show_time: datetime


class BookingDetailOutSchema(BookingOutSchema):
    seats: list[str]
