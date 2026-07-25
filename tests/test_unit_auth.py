import pytest
from datetime import datetime, timedelta, timezone
from jose import jwt
from unittest.mock import patch, MagicMock

from app.utils.helper import (
    _generate_token,
    decode_token,
    decode_refresh_token,
    generate_otp,
    generate_access_token_and_refresh_token,
)
from app.core.config import settings


class TestOTPGeneration:

    def test_generate_otp_returns_6_digits(self):
        otp = generate_otp()
        assert len(otp) == 6
        assert otp.isdigit()

    def test_generate_otp_is_random(self):
        otps = {generate_otp() for _ in range(20)}
        assert len(otps) > 1


class TestJWTTokenGeneration:

    def test_generate_access_token(self):
        payload = {"user_id": "test-user-id"}
        token = _generate_token(
            data=payload,
            expires_delta=timedelta(minutes=30),
            secret=settings.JWT_SECRET_ACCESS_KEY,
            token_type="access",
        )
        assert isinstance(token, str)
        assert len(token) > 0

    def test_token_contains_correct_type(self):
        payload = {"user_id": "test-user-id"}
        token = _generate_token(
            data=payload,
            expires_delta=timedelta(minutes=30),
            secret=settings.JWT_SECRET_ACCESS_KEY,
            token_type="access",
        )
        decoded = jwt.decode(token, settings.JWT_SECRET_ACCESS_KEY, algorithms=[settings.JWT_ALGORITHM])
        assert decoded["type"] == "access"

    def test_token_contains_sub_claim(self):
        payload = {"user_id": "abc-123"}
        token = _generate_token(
            data=payload,
            expires_delta=timedelta(minutes=30),
            secret=settings.JWT_SECRET_ACCESS_KEY,
            token_type="access",
        )
        decoded = jwt.decode(token, settings.JWT_SECRET_ACCESS_KEY, algorithms=[settings.JWT_ALGORITHM])
        assert decoded["sub"] == "abc-123"
        assert "user_id" not in decoded

    def test_token_has_expiry(self):
        payload = {"user_id": "test-user-id"}
        token = _generate_token(
            data=payload,
            expires_delta=timedelta(minutes=30),
            secret=settings.JWT_SECRET_ACCESS_KEY,
            token_type="access",
        )
        decoded = jwt.decode(token, settings.JWT_SECRET_ACCESS_KEY, algorithms=[settings.JWT_ALGORITHM])
        assert "exp" in decoded
        exp_time = datetime.fromtimestamp(decoded["exp"], tz=timezone.utc)
        assert exp_time > datetime.now(timezone.utc)

    def test_refresh_token_uses_different_secret(self):
        payload = {"user_id": "test-user-id"}
        access_token = _generate_token(
            data=payload,
            expires_delta=timedelta(minutes=30),
            secret=settings.JWT_SECRET_ACCESS_KEY,
            token_type="access",
        )
        refresh_token = _generate_token(
            data=payload,
            expires_delta=timedelta(days=7),
            secret=settings.JWT_SECRET_REFRESH_KEY,
            token_type="refresh",
        )
        assert access_token != refresh_token

    def test_generate_access_and_refresh_tokens(self):
        response = MagicMock()
        tokens = generate_access_token_and_refresh_token(
            payload={"user_id": "test-user-id"}, response=response
        )
        assert "access_token" in tokens
        assert "refresh_token" in tokens
        assert tokens["access_token"] != tokens["refresh_token"]


class TestJWTTokenDecoding:

    def test_decode_valid_access_token(self):
        payload = {"user_id": "test-user-id"}
        token = _generate_token(
            data=payload,
            expires_delta=timedelta(minutes=30),
            secret=settings.JWT_SECRET_ACCESS_KEY,
            token_type="access",
        )
        result = decode_token(token, settings.JWT_SECRET_ACCESS_KEY)
        assert result is not None
        assert result["sub"] == "test-user-id"
        assert result["type"] == "access"

    def test_decode_valid_refresh_token(self):
        payload = {"user_id": "test-user-id"}
        token = _generate_token(
            data=payload,
            expires_delta=timedelta(days=7),
            secret=settings.JWT_SECRET_REFRESH_KEY,
            token_type="refresh",
        )
        result = decode_refresh_token(token)
        assert result is not None
        assert result["sub"] == "test-user-id"
        assert result["type"] == "refresh"

    def test_decode_expired_token_returns_none(self):
        payload = {"user_id": "test-user-id"}
        token = _generate_token(
            data=payload,
            expires_delta=timedelta(seconds=-1),
            secret=settings.JWT_SECRET_ACCESS_KEY,
            token_type="access",
        )
        result = decode_token(token, settings.JWT_SECRET_ACCESS_KEY)
        assert result is None

    def test_decode_with_wrong_secret_returns_none(self):
        payload = {"user_id": "test-user-id"}
        token = _generate_token(
            data=payload,
            expires_delta=timedelta(minutes=30),
            secret=settings.JWT_SECRET_ACCESS_KEY,
            token_type="access",
        )
        result = decode_token(token, "wrong-secret-key")
        assert result is None

    def test_decode_tampered_token_returns_none(self):
        payload = {"user_id": "test-user-id"}
        token = _generate_token(
            data=payload,
            expires_delta=timedelta(minutes=30),
            secret=settings.JWT_SECRET_ACCESS_KEY,
            token_type="access",
        )
        tampered = token[:-5] + "XXXXX"
        result = decode_token(tampered, settings.JWT_SECRET_ACCESS_KEY)
        assert result is None

    def test_decode_refresh_token_with_access_secret_returns_none(self):
        payload = {"user_id": "test-user-id"}
        token = _generate_token(
            data=payload,
            expires_delta=timedelta(days=7),
            secret=settings.JWT_SECRET_REFRESH_KEY,
            token_type="refresh",
        )
        result = decode_token(token, settings.JWT_SECRET_ACCESS_KEY)
        assert result is None

    def test_decode_refresh_token_rejects_non_refresh_type(self):
        payload = {"user_id": "test-user-id"}
        token = _generate_token(
            data=payload,
            expires_delta=timedelta(minutes=30),
            secret=settings.JWT_SECRET_REFRESH_KEY,
            token_type="access",
        )
        result = decode_refresh_token(token)
        assert result is None

    def test_decode_with_wrong_algorithm_fails(self):
        payload = {"user_id": "test-user-id"}
        token = jwt.encode(
            {**payload, "exp": datetime.now(timezone.utc) + timedelta(minutes=30), "type": "access"},
            settings.JWT_SECRET_ACCESS_KEY,
            algorithm="HS512",
        )
        result = decode_token(token, settings.JWT_SECRET_ACCESS_KEY)
        assert result is None
