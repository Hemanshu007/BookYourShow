import pytest
import httpx
from unittest.mock import Mock, patch
from fastapi import status
from tests.conftest import global_fake_redis
from tests.test_utils import assert_response_structure
from app.services.auth_service import GOOGLE_TOKEN_URL, GOOGLE_USERINFO_URL


@pytest.mark.asyncio(loop_scope="session")
class TestAuthentication:

    async def test_send_otp_success(self, client):
        email = "jaymin.dave@armakuni.com"

        response = await client.post("/api/v1/auth/send-otp", json={"email": email})

        assert response.status_code == status.HTTP_200_OK
        body = response.json()
        assert_response_structure(body)
        assert body["message"] == "OTP sent to your email"
        assert await global_fake_redis.exists(email)

    async def test_signin_success(self, client):
        email = "jaymin4724@gmail.com"
        await client.post("/api/v1/auth/send-otp", json={"email": email})
        otp = await global_fake_redis.hget(email, "otp")

        response = await client.post(
            "/api/v1/auth/signin", json={"email": email, "otp": otp}
        )

        assert response.status_code == status.HTTP_201_CREATED
        body = response.json()
        assert_response_structure(body)
        assert "successfully" in body["message"].lower()
        assert "access_token" in body["data"]
        assert "refresh_token" in body["data"]

    async def test_google_login_redirect(self, client):
        response = await client.get("/api/v1/auth/google/login", follow_redirects=False)

        assert response.status_code in [
            status.HTTP_302_FOUND,
            status.HTTP_307_TEMPORARY_REDIRECT,
        ]
        assert "accounts.google.com" in response.headers["location"]

    async def test_google_callback_redirects_to_frontend_with_tokens(self, client):
        # The service's internal httpx.AsyncClient (real network transport) and the
        # test's own ASGI-transport client share the same httpx.AsyncClient class,
        # so the mock must only intercept calls to Google's URLs and pass everything
        # else (i.e. the test client hitting our own app) through to the real method.
        token_resp = Mock()
        token_resp.status_code = 200
        token_resp.json.return_value = {"access_token": "fake-google-access-token"}

        userinfo_resp = Mock()
        userinfo_resp.json.return_value = {
            "email": "googleuser@example.com",
            "sub": "google-sub-123",
            "given_name": "Test",
            "family_name": "User",
        }

        original_get = httpx.AsyncClient.get
        original_post = httpx.AsyncClient.post

        async def fake_get(self_client, url, *args, **kwargs):
            if str(url) == GOOGLE_USERINFO_URL:
                return userinfo_resp
            return await original_get(self_client, url, *args, **kwargs)

        async def fake_post(self_client, url, *args, **kwargs):
            if str(url) == GOOGLE_TOKEN_URL:
                return token_resp
            return await original_post(self_client, url, *args, **kwargs)

        with patch("httpx.AsyncClient.get", new=fake_get), patch(
            "httpx.AsyncClient.post", new=fake_post
        ):
            response = await client.get(
                "/api/v1/auth/google/callback",
                params={"code": "fake-code"},
                follow_redirects=False,
            )

        assert response.status_code in [
            status.HTTP_302_FOUND,
            status.HTTP_307_TEMPORARY_REDIRECT,
        ]
        location = response.headers["location"]
        assert location.startswith("http://localhost:5173/auth/callback#")

        fragment = location.split("#", 1)[1]
        params = dict(p.split("=") for p in fragment.split("&"))
        assert "access_token" in params
        assert "refresh_token" in params
