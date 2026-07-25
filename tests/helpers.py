from unittest.mock import AsyncMock, Mock, patch
from tests.fake_redis import global_fake_redis


ADMIN_EMAIL = "jaymin.dave@armakuni.com"
THEATRE_ADMIN_EMAIL = "jaymin4724@gmail.com"
USER_EMAIL = "regularuser@example.com"

MOCK_OMDB_RESPONSE = {
    "Response": "True",
    "Title": "The Shawshank Redemption",
    "Runtime": "142 min",
    "Plot": "Two imprisoned men bond over a number of years.",
    "Genre": "Drama",
    "imdbRating": "9.3",
    "imdbID": "tt0111161",
}


async def signin_as_admin(client):
    await client.post("/api/v1/auth/send-otp", json={"email": ADMIN_EMAIL})
    otp = await global_fake_redis.hget(ADMIN_EMAIL, "otp")
    response = await client.post(
        "/api/v1/auth/signin", json={"email": ADMIN_EMAIL, "otp": otp}
    )
    token = response.json()["data"]["access_token"]
    client.headers.update({"Authorization": f"Bearer {token}"})


async def signin_as_theatre_admin(client):
    await client.post("/api/v1/auth/send-otp", json={"email": THEATRE_ADMIN_EMAIL})
    otp = await global_fake_redis.hget(THEATRE_ADMIN_EMAIL, "otp")
    response = await client.post(
        "/api/v1/auth/signin", json={"email": THEATRE_ADMIN_EMAIL, "otp": otp}
    )
    token = response.json()["data"]["access_token"]
    client.headers.update({"Authorization": f"Bearer {token}"})


async def signin_as_user(client) -> str:
    await client.post("/api/v1/auth/send-otp", json={"email": USER_EMAIL})
    otp = await global_fake_redis.hget(USER_EMAIL, "otp")
    response = await client.post(
        "/api/v1/auth/signin", json={"email": USER_EMAIL, "otp": otp}
    )
    token = response.json()["data"]["access_token"]
    client.headers.update({"Authorization": f"Bearer {token}"})
    return token


def mock_omdb_response(response_data=None):
    data = response_data or MOCK_OMDB_RESPONSE
    mock_response = Mock()
    mock_response.status_code = 200
    mock_response.json.return_value = data
    return patch("httpx.AsyncClient.get", new_callable=AsyncMock, return_value=mock_response)
