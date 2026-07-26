"""
Seed script for Locust load tests.

Creates: admin, theatre admin, a show with N seats, and M pre-seeded users.
Run once before starting Locust:  python load_tests/seed.py

Requires the FastAPI server running on http://localhost:8000
and Redis accessible on localhost:6379.
"""

import json
import subprocess
import redis as sync_redis
import httpx
from datetime import datetime, timedelta, timezone

BASE_URL = "http://localhost:8000"
NUM_USERS = 200

ADMIN_EMAIL = "jaymin.dave@armakuni.com"
THEATRE_ADMIN_EMAIL = "jaymin4724@gmail.com"
USER_EMAIL_PREFIX = "loaduser"

LAYOUT_PAYLOAD = {
    "layout": [
        [
            {"grid_type": "seat", "category": "recliner"},
            {"grid_type": "seat", "category": "recliner"},
            {"grid_type": "seat", "category": "premium"},
            {"grid_type": "seat", "category": "premium"},
            {"grid_type": "seat", "category": "standard"},
        ],
        [
            {"grid_type": "seat", "category": "standard"},
            {"grid_type": "seat", "category": "standard"},
            {"grid_type": "seat", "category": "standard"},
            {"grid_type": "seat", "category": "standard"},
            {"grid_type": "seat", "category": "standard"},
        ],
    ],
    "metadata": {"grid_rows": 2, "grid_columns": 5},
}

CATEGORY_PRICE = {"recliner": 300, "premium": 250, "standard": 150}

TOTAL_SEATS = 10
SEAT_IDS = [f"{chr(65 + r)}{c + 1}" for r in range(2) for c in range(5)]


def signin(client, email):
    resp = client.post(f"{BASE_URL}/api/v1/auth/send-otp", json={"email": email})
    assert resp.status_code == 200, f"send-otp failed for {email}: {resp.text}"

    r = sync_redis.Redis(host="localhost", port=6379, decode_responses=True)
    otp_data = r.hgetall(email)
    r.close()
    otp = otp_data.get("otp", "000000")

    resp = client.post(
        f"{BASE_URL}/api/v1/auth/signin",
        json={"email": email, "otp": otp},
    )
    assert resp.status_code in (200, 201), f"signin failed for {email}: {resp.text}"
    return resp.json()["data"]["access_token"]


def insert_movie():
    result = subprocess.run(
        ["docker", "exec", "7b021be6e5e6_postgres_container", "psql", "-U", "postgres",
         "-d", "booking_dev", "-t", "-A", "-c",
         "SELECT id FROM movies WHERE imdb_id='tt0111161';"],
        capture_output=True, text=True
    )
    existing = result.stdout.strip()
    if existing:
        return existing

    result = subprocess.run(
        ["docker", "exec", "7b021be6e5e6_postgres_container", "psql", "-U", "postgres",
         "-d", "booking_dev", "-t", "-A", "-c",
         "INSERT INTO movies (name, duration, description, rating, genre, imdb_id, is_deleted) "
         "VALUES ('The Shawshank Redemption', '142 minutes'::interval, 'Two imprisoned men bond.', 9.3, 'Drama', 'tt0111161', false) "
         "RETURNING id;"],
        capture_output=True, text=True
    )
    lines = [l.strip() for l in result.stdout.strip().split('\n') if l.strip() and not l.strip().startswith('INSERT')]
    return lines[-1] if lines else None


def main():
    with httpx.Client(timeout=30) as client:
        print("Signing in as admin...")
        admin_token = signin(client, ADMIN_EMAIL)
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        print("Creating theatre...")
        resp = client.post(
            f"{BASE_URL}/api/v1/admin/create-theatre",
            json={
                "name": "LoadTest Theatre",
                "area": "Test Area",
                "city": "Test City",
                "operator_email": THEATRE_ADMIN_EMAIL,
            },
            headers=admin_headers,
        )
        assert resp.status_code in (200, 201), f"create-theatre failed: {resp.text}"
        theatre_id = resp.json()["data"]["id"]
        print(f"  theatre_id={theatre_id}")

        print("Creating movie via DB...")
        movie_id = insert_movie()
        print(f"  movie_id={movie_id}")

        print("Signing in as theatre admin...")
        theatre_admin_token = signin(client, THEATRE_ADMIN_EMAIL)
        ta_headers = {"Authorization": f"Bearer {theatre_admin_token}"}

        print("Creating layout...")
        resp = client.post(
            f"{BASE_URL}/api/v1/theatre-admin/create-layout",
            json={
                "name": "LoadTest Layout",
                "theatre_id": theatre_id,
                "layout": LAYOUT_PAYLOAD,
            },
            headers=ta_headers,
        )
        assert resp.status_code in (200, 201), f"create-layout failed: {resp.text}"
        layout_id = resp.json()["data"]["id"]
        print(f"  layout_id={layout_id}")

        print("Creating screen...")
        resp = client.post(
            f"{BASE_URL}/api/v1/theatre-admin/create-screen",
            json={
                "name": "LoadTest Screen",
                "theatre_id": theatre_id,
                "layout_id": layout_id,
            },
            headers=ta_headers,
        )
        assert resp.status_code in (200, 201), f"create-screen failed: {resp.text}"
        screen_id = resp.json()["data"]["id"]
        print(f"  screen_id={screen_id}")

        start_time = (datetime.now(timezone.utc) + timedelta(hours=3)).isoformat()
        print("Creating show...")
        resp = client.post(
            f"{BASE_URL}/api/v1/theatre-admin/create-show",
            json={
                "screen_id": screen_id,
                "movie_id": movie_id,
                "start_time": start_time,
                "category_price": CATEGORY_PRICE,
            },
            headers=ta_headers,
        )
        assert resp.status_code in (200, 201), f"create-show failed: {resp.text}"
        show_id = resp.json()["data"]["id"]
        print(f"  show_id={show_id}")

        print(f"Pre-seeding {NUM_USERS} users...")
        users = []
        for i in range(NUM_USERS):
            email = f"{USER_EMAIL_PREFIX}{i}@test.com"
            try:
                token = signin(client, email)
                users.append({"email": email, "token": token})
                if (i + 1) % 50 == 0:
                    print(f"  {i + 1}/{NUM_USERS} users seeded")
            except Exception as e:
                print(f"  WARN: failed to seed {email}: {e}")

    output = {
        "show_id": show_id,
        "seat_ids": SEAT_IDS,
        "total_seats": TOTAL_SEATS,
        "users": users,
    }

    out_path = "load_tests/test_data.json"
    with open(out_path, "w") as f:
        json.dump(output, f, indent=2)

    print(f"\nDone. Seeded {len(users)} users.")
    print(f"Show: {show_id}")
    print(f"Seats: {TOTAL_SEATS} ({', '.join(SEAT_IDS)})")
    print(f"Test data written to {out_path}")


if __name__ == "__main__":
    main()
