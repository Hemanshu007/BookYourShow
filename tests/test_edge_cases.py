import pytest
from fastapi import status
from uuid import uuid4
from tests.helpers import (
    signin_as_admin as _signin_as_admin,
    signin_as_theatre_admin as _signin_as_theatre_admin,
    signin_as_user as _signin_as_user,
    mock_omdb_response,
)
from tests.fake_redis import global_fake_redis
from tests.test_theatre_admin import LAYOUT_PAYLOAD, CATEGORY_PRICE, show_start_time


async def signin_as_admin(client):
    await _signin_as_admin(client)


async def signin_as_theatre_admin(client):
    await _signin_as_theatre_admin(client)


async def signin_as_user(client):
    return await _signin_as_user(client)


async def _build_chain(client) -> dict:
    await signin_as_admin(client)

    theatre_resp = await client.post(
        "/api/v1/admin/create-theatre",
        json={
            "name": "Edge Theatre",
            "area": "Satellite",
            "city": "Ahmedabad",
            "operator_email": "jaymin4724@gmail.com",
        },
    )
    theatre_id = theatre_resp.json()["data"]["id"]

    with mock_omdb_response():
        movie_resp = await client.post(
            "/api/v1/admin/create-movie", json={"imdb_id": "tt0111161"}
        )
    movie_id = movie_resp.json()["data"]["id"]

    await signin_as_theatre_admin(client)

    layout_resp = await client.post(
        "/api/v1/theatre-admin/create-layout",
        json={
            "name": "Edge Layout",
            "theatre_id": theatre_id,
            "layout": LAYOUT_PAYLOAD,
        },
    )
    layout_id = layout_resp.json()["data"]["id"]

    screen_resp = await client.post(
        "/api/v1/theatre-admin/create-screen",
        json={
            "name": "Edge Screen",
            "theatre_id": theatre_id,
            "layout_id": layout_id,
        },
    )
    screen_id = screen_resp.json()["data"]["id"]

    show_resp = await client.post(
        "/api/v1/theatre-admin/create-show",
        json={
            "screen_id": screen_id,
            "movie_id": movie_id,
            "start_time": show_start_time(hours_ahead=3),
            "category_price": CATEGORY_PRICE,
        },
    )
    show_id = show_resp.json()["data"]["id"]

    return {
        "theatre_id": theatre_id,
        "movie_id": movie_id,
        "layout_id": layout_id,
        "screen_id": screen_id,
        "show_id": show_id,
    }


@pytest.mark.asyncio(loop_scope="session")
class TestAuthEdgeCases:

    async def test_signin_wrong_otp(self, client):
        email = "edgetest@example.com"
        await client.post("/api/v1/auth/send-otp", json={"email": email})

        response = await client.post(
            "/api/v1/auth/signin", json={"email": email, "otp": "000000"}
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    async def test_signin_exhausted_otp_tries(self, client):
        email = "exhaust@example.com"
        await client.post("/api/v1/auth/send-otp", json={"email": email})

        for _ in range(3):
            await client.post(
                "/api/v1/auth/signin", json={"email": email, "otp": "000000"}
            )

        response = await client.post(
            "/api/v1/auth/signin", json={"email": email, "otp": "000000"}
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    async def test_signin_without_sending_otp(self, client):
        response = await client.post(
            "/api/v1/auth/signin",
            json={"email": "never-sent@example.com", "otp": "123456"},
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio(loop_scope="session")
class TestAdminEdgeCases:

    async def test_create_movie_no_imdb_or_title(self, client):
        await signin_as_admin(client)
        response = await client.post("/api/v1/admin/create-movie", json={})
        assert response.status_code in [
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_422_UNPROCESSABLE_ENTITY,
        ]

    async def test_create_movie_invalid_omdb_response(self, client):
        await signin_as_admin(client)
        not_found_response = {"Response": "False", "Error": "Movie not found!"}
        with mock_omdb_response(not_found_response):
            response = await client.post(
                "/api/v1/admin/create-movie", json={"imdb_id": "tt0000000"}
            )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    async def test_create_movie_duplicate(self, client):
        await signin_as_admin(client)
        with mock_omdb_response():
            resp1 = await client.post(
                "/api/v1/admin/create-movie", json={"imdb_id": "tt0111161"}
            )
        assert resp1.status_code == status.HTTP_201_CREATED

        with mock_omdb_response():
            resp2 = await client.post(
                "/api/v1/admin/create-movie", json={"imdb_id": "tt0111161"}
            )
        assert resp2.status_code == status.HTTP_400_BAD_REQUEST

    async def test_delete_nonexistent_theatre(self, client):
        await signin_as_admin(client)
        fake_id = str(uuid4())
        response = await client.delete(f"/api/v1/admin/theatre/delete/{fake_id}")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    async def test_delete_nonexistent_movie(self, client):
        await signin_as_admin(client)
        fake_id = str(uuid4())
        response = await client.delete(f"/api/v1/admin/movie/delete/{fake_id}")
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio(loop_scope="session")
class TestBookingEdgeCases:

    async def test_lock_seat_unauthorized(self, client):
        ids = await _build_chain(client)
        client.headers.pop("Authorization", None)
        response = await client.post(
            f"/api/v1/users/show/{ids['show_id']}/seat-lock",
            json={"seat_array": ["A1"]},
        )
        assert response.status_code in [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        ]

    async def test_lock_already_booked_seat(self, client):
        ids = await _build_chain(client)
        await signin_as_user(client)

        await client.post(
            f"/api/v1/users/show/{ids['show_id']}/seat-lock",
            json={"seat_array": ["B1"]},
        )
        await client.post(
            f"/api/v1/users/show/{ids['show_id']}/seat-book",
            json={"seat_array": ["B1"]},
        )

        response = await client.post(
            f"/api/v1/users/show/{ids['show_id']}/seat-lock",
            json={"seat_array": ["B1"]},
        )
        assert response.status_code in [
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_500_INTERNAL_SERVER_ERROR,
        ]

    async def test_book_without_locking_first(self, client):
        ids = await _build_chain(client)
        await signin_as_user(client)
        response = await client.post(
            f"/api/v1/users/show/{ids['show_id']}/seat-book",
            json={"seat_array": ["A1"]},
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    async def test_cancel_nonexistent_booking(self, client):
        await signin_as_user(client)
        fake_id = str(uuid4())
        response = await client.post(f"/api/v1/users/booking/{fake_id}/cancel")
        assert response.status_code in [
            status.HTTP_404_NOT_FOUND,
            status.HTTP_500_INTERNAL_SERVER_ERROR,
        ]
