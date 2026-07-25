import pytest
from fastapi import status
from datetime import datetime, timedelta, timezone
from tests.helpers import (
    signin_as_admin as _signin_as_admin,
    signin_as_theatre_admin as _signin_as_theatre_admin,
    signin_as_user as _signin_as_user,
    mock_omdb_response,
)
from tests.test_theatre_admin import LAYOUT_PAYLOAD, CATEGORY_PRICE, show_start_time


async def signin_as_admin(client):
    await _signin_as_admin(client)


async def signin_as_theatre_admin(client):
    await _signin_as_theatre_admin(client)


async def signin_as_user(client):
    await _signin_as_user(client)


async def build_chain_with_show(client, category_price: dict) -> dict:
    await signin_as_admin(client)

    theatre_resp = await client.post(
        "/api/v1/admin/create-theatre",
        json={
            "name": "Pricing Theatre",
            "area": "Navrangpura",
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
            "name": "Pricing Layout",
            "theatre_id": theatre_id,
            "layout": LAYOUT_PAYLOAD,
        },
    )
    layout_id = layout_resp.json()["data"]["id"]

    screen_resp = await client.post(
        "/api/v1/theatre-admin/create-screen",
        json={
            "name": "Pricing Screen",
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
            "category_price": category_price,
        },
    )
    show_id = show_resp.json()["data"]["id"]

    return {"theatre_id": theatre_id, "movie_id": movie_id, "show_id": show_id}


@pytest.mark.asyncio(loop_scope="session")
class TestPricing:

    async def test_recliner_seat_price(self, client, db):
        ids = await build_chain_with_show(client, {"recliner": 300, "premium": 250})
        await signin_as_user(client)

        await client.post(
            f"/api/v1/users/show/{ids['show_id']}/seat-lock",
            json={"seat_array": ["A1"]},
        )

        resp = await client.post(
            f"/api/v1/users/show/{ids['show_id']}/seat-book",
            json={"seat_array": ["A1"]},
        )

        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.json()["data"]["total_paid"] == 300

    async def test_premium_seat_price(self, client, db):
        ids = await build_chain_with_show(client, {"recliner": 300, "premium": 250})
        await signin_as_user(client)

        await client.post(
            f"/api/v1/users/show/{ids['show_id']}/seat-lock",
            json={"seat_array": ["B1"]},
        )

        resp = await client.post(
            f"/api/v1/users/show/{ids['show_id']}/seat-book",
            json={"seat_array": ["B1"]},
        )

        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.json()["data"]["total_paid"] == 250

    async def test_multi_seat_total_price(self, client, db):
        ids = await build_chain_with_show(client, {"recliner": 300, "premium": 250})
        await signin_as_user(client)

        await client.post(
            f"/api/v1/users/show/{ids['show_id']}/seat-lock",
            json={"seat_array": ["A1", "A2", "B1"]},
        )

        resp = await client.post(
            f"/api/v1/users/show/{ids['show_id']}/seat-book",
            json={"seat_array": ["A1", "A2", "B1"]},
        )

        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.json()["data"]["total_paid"] == 300 + 300 + 250

    async def test_different_pricing_tiers(self, client, db):
        ids = await build_chain_with_show(client, {"recliner": 500, "premium": 150})
        await signin_as_user(client)

        await client.post(
            f"/api/v1/users/show/{ids['show_id']}/seat-lock",
            json={"seat_array": ["A1", "B1"]},
        )

        resp = await client.post(
            f"/api/v1/users/show/{ids['show_id']}/seat-book",
            json={"seat_array": ["A1", "B1"]},
        )

        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.json()["data"]["total_paid"] == 500 + 150
