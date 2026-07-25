import pytest
from fastapi import status
from datetime import datetime, timedelta, timezone
from tests.helpers import (
    signin_as_admin as _signin_as_admin,
    signin_as_theatre_admin as _signin_as_theatre_admin,
    MOCK_OMDB_RESPONSE,
    mock_omdb_response,
)
from tests.test_utils import assert_response_structure


async def signin_as_admin(client):
    await _signin_as_admin(client)


async def signin_as_theatre_admin(client):
    await _signin_as_theatre_admin(client)


LAYOUT_PAYLOAD = {
    "layout": [
        [
            {"grid_type": "wall", "category": None},
            {"grid_type": "seat", "category": "recliner"},
            {"grid_type": "seat", "category": "recliner"},
            {"grid_type": "seat", "category": "recliner"},
            {"grid_type": "wall", "category": None},
        ],
        [
            {"grid_type": "seat", "category": "premium"},
            {"grid_type": "wall", "category": None},
            {"grid_type": "seat", "category": "premium"},
            {"grid_type": "wall", "category": None},
            {"grid_type": "seat", "category": "premium"},
        ],
        [
            {"grid_type": "wall", "category": None},
            {"grid_type": "wall", "category": None},
            {"grid_type": "wall", "category": None},
            {"grid_type": "wall", "category": None},
            {"grid_type": "wall", "category": None},
        ],
        [
            {"grid_type": "wall", "category": None},
            {"grid_type": "seat", "category": "recliner"},
            {"grid_type": "seat", "category": "recliner"},
            {"grid_type": "seat", "category": "recliner"},
            {"grid_type": "wall", "category": None},
        ],
    ],
    "metadata": {"grid_rows": 4, "grid_columns": 5},
}

CATEGORY_PRICE = {"recliner": 300, "premium": 250}


def show_start_time(hours_ahead: int = 3) -> str:
    return (datetime.now(timezone.utc) + timedelta(hours=hours_ahead)).isoformat()


async def build_theatre_chain(client):
    await signin_as_admin(client)

    theatre_resp = await client.post(
        "/api/v1/admin/create-theatre",
        json={
            "name": "PVR Cinemas",
            "area": "Thaltej",
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
            "name": "Screen A Layout",
            "theatre_id": theatre_id,
            "layout": LAYOUT_PAYLOAD,
        },
    )
    layout_id = layout_resp.json()["data"]["id"]

    screen_resp = await client.post(
        "/api/v1/theatre-admin/create-screen",
        json={
            "name": "Screen 1",
            "theatre_id": theatre_id,
            "layout_id": layout_id,
        },
    )
    screen_id = screen_resp.json()["data"]["id"]

    return {
        "theatre_id": theatre_id,
        "movie_id": movie_id,
        "layout_id": layout_id,
        "screen_id": screen_id,
    }


@pytest.mark.asyncio(loop_scope="session")
class TestTheatreAdmin:

    async def test_create_layout_success(self, client):
        await signin_as_admin(client)

        theatre_resp = await client.post(
            "/api/v1/admin/create-theatre",
            json={
                "name": "Layout Test Theatre",
                "area": "Bodakdev",
                "city": "Ahmedabad",
                "operator_email": "jaymin4724@gmail.com",
            },
        )
        theatre_id = theatre_resp.json()["data"]["id"]

        await signin_as_theatre_admin(client)

        payload = {
            "name": "Screen A Layout",
            "theatre_id": theatre_id,
            "layout": LAYOUT_PAYLOAD,
        }
        response = await client.post(
            "/api/v1/theatre-admin/create-layout", json=payload
        )

        assert response.status_code == status.HTTP_201_CREATED
        body = response.json()

        assert "successfully" in body["message"].lower()

    async def test_create_screen_success(self, client):
        ids = await build_theatre_chain(client)

        payload = {
            "name": "Screen 2",
            "theatre_id": ids["theatre_id"],
            "layout_id": ids["layout_id"],
        }
        response = await client.post(
            "/api/v1/theatre-admin/create-screen", json=payload
        )

        assert response.status_code == status.HTTP_201_CREATED
        body = response.json()
        assert_response_structure(body)
        assert "successfully" in body["message"].lower()

    async def test_create_show_success(self, client):
        ids = await build_theatre_chain(client)

        payload = {
            "screen_id": ids["screen_id"],
            "movie_id": ids["movie_id"],
            "start_time": show_start_time(hours_ahead=3),
            "category_price": CATEGORY_PRICE,
        }
        response = await client.post("/api/v1/theatre-admin/create-show", json=payload)

        assert response.status_code == status.HTTP_201_CREATED
        body = response.json()
        assert_response_structure(body)
        assert "successfully" in body["message"].lower()

    async def test_delete_screen_success(self, client):
        ids = await build_theatre_chain(client)

        create_resp = await client.post(
            "/api/v1/theatre-admin/create-screen",
            json={
                "name": "Screen To Delete",
                "theatre_id": ids["theatre_id"],
                "layout_id": ids["layout_id"],
            },
        )
        screen_id = create_resp.json()["data"]["id"]

        response = await client.delete(
            f"/api/v1/theatre-admin/screen/delete/{screen_id}"
        )

        assert response.status_code == status.HTTP_200_OK
        body = response.json()
        assert_response_structure(body)
        assert "deleted" in body["message"].lower()

    async def test_delete_show_success(self, client):
        ids = await build_theatre_chain(client)

        create_resp = await client.post(
            "/api/v1/theatre-admin/create-show",
            json={
                "screen_id": ids["screen_id"],
                "movie_id": ids["movie_id"],
                "start_time": show_start_time(hours_ahead=3),
                "category_price": CATEGORY_PRICE,
            },
        )
        show_id = create_resp.json()["data"]["id"]

        response = await client.delete(f"/api/v1/theatre-admin/show/delete/{show_id}")

        assert response.status_code == status.HTTP_200_OK
        body = response.json()
        assert_response_structure(body)
        assert "deleted" in body["message"].lower()
