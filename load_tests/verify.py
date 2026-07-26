"""
Post-test verification: checks for double-bookings in the database.

Run after Locust finishes:
  python load_tests/verify.py

Requires: DATABASE_URL pointing to the same DB the API uses.
"""

import asyncio
import json
import os
import sys
from pathlib import Path

import asyncpg


TEST_DATA_PATH = Path(__file__).parent / "test_data.json"


async def verify():
    with open(TEST_DATA_PATH) as f:
        data = json.load(f)

    show_id = data["show_id"]
    total_seats = data["total_seats"]
    seat_ids = data["seat_ids"]

    db_url = os.environ.get(
        "DATABASE_URL",
        "postgresql://postgres:Suhi@localhost:5431/booking_dev",
    )

    print(f"\n{'='*60}")
    print(f"DOUBLE-BOOKING VERIFICATION")
    print(f"  Show ID:     {show_id}")
    print(f"  Total seats: {total_seats}")
    print(f"{'='*60}\n")

    conn = await asyncpg.connect(db_url)

    rows = await conn.fetch(
        """
        SELECT bsm.seats_number AS seat,
               bsm.booking_id,
               b.user_id,
               bsm.created_at,
               bsm.is_cancelled
        FROM booked_seats_map bsm
        JOIN bookings b ON b.id = bsm.booking_id
        WHERE bsm.show_id = $1::uuid
        ORDER BY bsm.created_at
        """,
        show_id,
    )

    print(f"Total seat records for this show: {len(rows)}\n")

    seat_bookings = {}
    for row in rows:
        seat = row["seat"]
        if seat not in seat_bookings:
            seat_bookings[seat] = []
        if not row["is_cancelled"]:
            seat_bookings[seat].append({
                "booking_id": str(row["booking_id"]),
                "user_id": str(row["user_id"]),
                "created_at": str(row["created_at"]),
            })

    double_booked = {s: bookings for s, bookings in seat_bookings.items() if len(bookings) > 1}

    all_clean = True
    for seat in seat_ids:
        count = len(seat_bookings.get(seat, []))
        if count > 1:
            all_clean = False
            print(f"  [FAIL] Seat {seat}: booked {count} times")
            for b in seat_bookings[seat]:
                print(f"         booking={b['booking_id']} user={b['user_id']} at={b['created_at']}")
        elif count == 1:
            print(f"  [OK]   Seat {seat}: 1 booking")
        else:
            print(f"  [--]   Seat {seat}: not booked")

    print(f"\n{'='*60}")
    if all_clean:
        print(f"PASS — Zero double-bookings detected.")
        print(f"  {len(rows)} bookings, {len(seat_bookings)} unique seats booked.")
    else:
        print(f"FAIL — {len(double_booked)} seat(s) were double-booked!")
        sys.exit(1)
    print(f"{'='*60}\n")

    await conn.close()


if __name__ == "__main__":
    asyncio.run(verify())
