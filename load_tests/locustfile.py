"""
Locust load test for seat-lock contention.

Usage:
  1. Run seed.py first           python load_tests/seed.py
  2. Start the API server        docker compose up
  3. Run Locust                  locust -f load_tests/locustfile.py --host http://localhost:8000
  4. After test, run             python load_tests/verify.py
"""

import json
import random
import threading
from pathlib import Path

from locust import HttpUser, task, between, events

TEST_DATA_PATH = Path(__file__).parent / "test_data.json"

_test_data = None
_user_index = 0
_user_index_lock = threading.Lock()

lock_success = 0
lock_fail = 0
book_success = 0
book_fail = 0


def load_test_data():
    with open(TEST_DATA_PATH) as f:
        return json.load(f)


def get_test_data():
    global _test_data
    if _test_data is None:
        _test_data = load_test_data()
    return _test_data


def next_user_index():
    global _user_index
    with _user_index_lock:
        idx = _user_index
        _user_index += 1
        return idx


@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    global lock_success, lock_fail, book_success, book_fail
    lock_success = 0
    lock_fail = 0
    book_success = 0
    book_fail = 0

    data = get_test_data()
    print(f"\n{'='*60}")
    print(f"SEAT LOCK CONTENTION TEST")
    print(f"  Show ID:     {data['show_id']}")
    print(f"  Total seats: {data['total_seats']}")
    print(f"  Users:       {len(data['users'])}")
    print(f"  Seats:       {', '.join(data['seat_ids'])}")
    print(f"{'='*60}\n")


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    print(f"\n{'='*60}")
    print(f"RESULTS")
    print(f"  Lock success:  {lock_success}")
    print(f"  Lock rejected: {lock_fail}")
    print(f"  Book success:  {book_success}")
    print(f"  Book failed:   {book_fail}")
    print(f"{'='*60}")
    print(f"\nRun verify.py to check for double-bookings.")


class SeatLockContention(HttpUser):
    weight = 3
    wait_time = between(0.05, 0.15)

    def on_start(self):
        global _test_data
        data = get_test_data()
        idx = next_user_index()
        user_data = data["users"][idx % len(data["users"])]
        self.token = user_data["token"]
        self.show_id = data["show_id"]
        self.seat_ids = data["seat_ids"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        self.my_seat = None

    @task(5)
    def lock_and_book_seat(self):
        global lock_success, lock_fail, book_success, book_fail

        if self.my_seat:
            return

        seat = random.choice(self.seat_ids)

        with self.client.post(
            f"/api/v1/users/show/{self.show_id}/seat-lock",
            json={"seat_array": [seat]},
            headers=self.headers,
            name="/seat-lock [contention]",
            catch_response=True,
        ) as resp:
            if resp.status_code == 201:
                self.my_seat = seat
                lock_success += 1
                resp.success()
            elif resp.status_code == 400:
                lock_fail += 1
                resp.success()
            else:
                resp.failure(f"Unexpected status {resp.status_code}")

    @task(3)
    def book_locked_seat(self):
        global book_success, book_fail

        if not self.my_seat:
            return

        with self.client.post(
            f"/api/v1/users/show/{self.show_id}/seat-book",
            json={"seat_array": [self.my_seat]},
            headers=self.headers,
            name="/seat-book [contention]",
            catch_response=True,
        ) as resp:
            if resp.status_code == 201:
                book_success += 1
                resp.success()
            elif resp.status_code in (400, 403):
                book_fail += 1
                resp.success()
            else:
                resp.failure(f"Unexpected status {resp.status_code}")


class BrowseThroughput(HttpUser):
    weight = 1
    wait_time = between(0.5, 1.5)

    def on_start(self):
        data = get_test_data()
        self.show_id = data["show_id"]

    @task(3)
    def browse_show_details(self):
        self.client.get(
            f"/api/v1/users/show/{self.show_id}",
            name="/show/{id} [browse]",
        )
