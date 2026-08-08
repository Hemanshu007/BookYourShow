import pytest
import asyncio
from fastapi import status
from tests.helpers import (
    signin_as_admin as _signin_as_admin,
    signin_as_theatre_admin as _signin_as_theatre_admin,
    mock_omdb_response,
)
from tests.test_theatre_admin import LAYOUT_PAYLOAD, CATEGORY_PRICE, show_start_time


async def signin_as_admin(client):
    await _signin_as_admin(client)


async def signin_as_theatre_admin(client):
    await _signin_as_theatre_admin(client)


async def build_chain(client) -> dict:
    await signin_as_admin(client)

    theatre_resp = await client.post(
        "/api/v1/admin/create-theatre",
        json={
            "name": "Concurrency Theatre",
            "area": "CG Road",
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
            "name": "Concurrency Layout",
            "theatre_id": theatre_id,
            "layout": LAYOUT_PAYLOAD,
        },
    )
    layout_id = layout_resp.json()["data"]["id"]

    screen_resp = await client.post(
        "/api/v1/theatre-admin/create-screen",
        json={
            "name": "Concurrency Screen",
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

    return {"theatre_id": theatre_id, "movie_id": movie_id, "show_id": show_id}


async def _create_user_and_get_token(client, email: str) -> str:
    await client.post("/api/v1/auth/send-otp", json={"email": email})
    from tests.fake_redis import global_fake_redis

    otp = await global_fake_redis.hget(email, "otp")
    resp = await client.post(
        "/api/v1/auth/signin", json={"email": email, "otp": otp}
    )
    return resp.json()["data"]["access_token"]


@pytest.mark.asyncio(loop_scope="session")
class TestConcurrency:

    async def test_two_users_cannot_lock_same_seat(self, client, db):
        ids = await build_chain(client)

        token1 = await _create_user_and_get_token(client, "user1@concurrency.com")
        client.headers.update({"Authorization": f"Bearer {token1}"})

        resp1 = await client.post(
            f"/api/v1/users/show/{ids['show_id']}/seat-lock",
            json={"seat_array": ["A1"]},
        )

        token2 = await _create_user_and_get_token(client, "user2@concurrency.com")
        client.headers.update({"Authorization": f"Bearer {token2}"})

        resp2 = await client.post(
            f"/api/v1/users/show/{ids['show_id']}/seat-lock",
            json={"seat_array": ["A1"]},
        )

        results = sorted([resp1.status_code, resp2.status_code])
        assert results == [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST]

    async def test_two_users_can_lock_different_seats(self, client, db):
        ids = await build_chain(client)

        token1 = await _create_user_and_get_token(client, "user3@concurrency.com")
        client.headers.update({"Authorization": f"Bearer {token1}"})

        resp1 = await client.post(
            f"/api/v1/users/show/{ids['show_id']}/seat-lock",
            json={"seat_array": ["A1"]},
        )
        assert resp1.status_code == status.HTTP_201_CREATED

        token2 = await _create_user_and_get_token(client, "user4@concurrency.com")
        client.headers.update({"Authorization": f"Bearer {token2}"})

        resp2 = await client.post(
            f"/api/v1/users/show/{ids['show_id']}/seat-lock",
            json={"seat_array": ["A2"]},
        )
        assert resp2.status_code == status.HTTP_201_CREATED

    async def test_concurrent_lock_and_book_same_seat(self, client, db):
        ids = await build_chain(client)

        token1 = await _create_user_and_get_token(client, "user5@concurrency.com")
        client.headers.update({"Authorization": f"Bearer {token1}"})

        resp = await client.post(
            f"/api/v1/users/show/{ids['show_id']}/seat-lock",
            json={"seat_array": ["B1"]},
        )
        assert resp.status_code == status.HTTP_201_CREATED

        book_resp = await client.post(
            f"/api/v1/users/show/{ids['show_id']}/seat-book",
            json={"seat_array": ["B1"]},
        )
        assert book_resp.status_code == status.HTTP_201_CREATED

        token2 = await _create_user_and_get_token(client, "user6@concurrency.com")
        client.headers.update({"Authorization": f"Bearer {token2}"})

        lock_resp = await client.post(
            f"/api/v1/users/show/{ids['show_id']}/seat-lock",
            json={"seat_array": ["B1"]},
        )
        assert lock_resp.status_code == status.HTTP_400_BAD_REQUEST

    async def test_same_user_can_relock_own_seat(self, client, db):
        ids = await build_chain(client)

        token = await _create_user_and_get_token(client, "user7@concurrency.com")
        client.headers.update({"Authorization": f"Bearer {token}"})

        first = await client.post(
            f"/api/v1/users/show/{ids['show_id']}/seat-lock",
            json={"seat_array": ["A1"]},
        )
        assert first.status_code == status.HTTP_201_CREATED

        # Re-locking the same seat as the same user (e.g. a retry after a page
        # refresh) must succeed, not be treated as "locked by another user".
        second = await client.post(
            f"/api/v1/users/show/{ids['show_id']}/seat-lock",
            json={"seat_array": ["A1"]},
        )
        assert second.status_code == status.HTTP_201_CREATED

    async def test_failed_batch_lock_does_not_release_other_users_seat(self, client, db):
        ids = await build_chain(client)

        token1 = await _create_user_and_get_token(client, "user8@concurrency.com")
        client.headers.update({"Authorization": f"Bearer {token1}"})

        held = await client.post(
            f"/api/v1/users/show/{ids['show_id']}/seat-lock",
            json={"seat_array": ["A1"]},
        )
        assert held.status_code == status.HTTP_201_CREATED

        token2 = await _create_user_and_get_token(client, "user9@concurrency.com")
        client.headers.update({"Authorization": f"Bearer {token2}"})

        # user2 requests A1 (already held by user1) and A2 (free) together.
        # The whole batch must fail because of the A1 conflict.
        conflicting = await client.post(
            f"/api/v1/users/show/{ids['show_id']}/seat-lock",
            json={"seat_array": ["A1", "A2"]},
        )
        assert conflicting.status_code == status.HTTP_400_BAD_REQUEST

        # A2 was only newly claimed by user2's failed request, so it must have
        # been rolled back and be free for user1 to lock now.
        client.headers.update({"Authorization": f"Bearer {token1}"})
        a2_now_free = await client.post(
            f"/api/v1/users/show/{ids['show_id']}/seat-lock",
            json={"seat_array": ["A2"]},
        )
        assert a2_now_free.status_code == status.HTTP_201_CREATED

        # A1 was user1's *pre-existing* lock, untouched by user2's failed
        # batch — it must still be held by user1, not released.
        client.headers.update({"Authorization": f"Bearer {token2}"})
        a1_still_held = await client.post(
            f"/api/v1/users/show/{ids['show_id']}/seat-lock",
            json={"seat_array": ["A1"]},
        )
        assert a1_still_held.status_code == status.HTTP_400_BAD_REQUEST
