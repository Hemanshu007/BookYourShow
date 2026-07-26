# Movie Ticket Booking Platform

[![Tests](https://github.com/Hemanshu007/BookYourShow/actions/workflows/test.yml/badge.svg)](https://github.com/Hemanshu007/BookYourShow/actions/workflows/test.yml)
![Python](https://img.shields.io/badge/python-3.10-blue)
![License](https://img.shields.io/badge/license-MIT-green)

A production-grade backend for a movie ticket booking platform with real-time seat locking, role-based access control, and Elasticsearch-powered search. Built with FastAPI, PostgreSQL, and Redis.

## Features

- **Real-time seat locking** — Redis atomic operations prevent double-bookings under concurrent load
- **JWT + OTP authentication** — passwordless login via email OTP, Google OAuth, refresh token rotation
- **RBAC** — admin / theatre-admin / user roles with permission-level route guards
- **Full-text search** — Elasticsearch integration with auto-sync on data changes
- **Seat layout caching** — Redis-backed layout with DB fallback, dynamic lock status overlay
- **Show scheduling** — overlap detection, category-based pricing, ownership verification
- **Load tested** — 200 concurrent users, 9,400+ requests, zero double-bookings verified

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | FastAPI (async) |
| Database | PostgreSQL 16 + SQLAlchemy 2.0 (async) |
| Cache / Lock | Redis |
| Search | Elasticsearch 9.x |
| Migrations | Alembic |
| Auth | JWT (python-jose) + OTP via Redis |
| Containerization | Docker + Docker Compose |
| CI | GitHub Actions |
| Package Manager | uv |

## Quick Start

### With Docker (recommended)

```bash
# Clone the repo
git clone https://github.com/Hemanshu007/BookYourShow.git
cd BookYourShow

# Set up environment
cp .env.example .env.docker

# Start all services
docker compose up --build -d

# Run migrations
docker compose exec api uv run alembic upgrade head

# Seed roles, permissions, and test users
docker compose exec db psql -U postgres -d booking_dev -f /docker-entrypoint-initdb.d/seed_db.sql
# Or from host:
cat seed_db.sql | docker exec -i postgres_container psql -U postgres -d booking_dev
```

API is now running at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

### Without Docker

```bash
cp .env.example .env
# Edit .env with your PostgreSQL, Redis, and Elasticsearch credentials

uv sync
uv run alembic upgrade head
uv run fastapi dev app/main.py
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/send-otp` | — | Send OTP to email |
| POST | `/auth/signin` | — | Sign in with OTP |
| POST | `/auth/refresh-token` | Refresh token | Get new access token |
| POST | `/admin/create-user` | Admin | Create user with role |
| POST | `/admin/create-theatre` | Admin | Register theatre |
| POST | `/admin/create-movie` | Admin | Add movie by IMDB ID |
| POST | `/theatre-admin/create-layout` | Theatre Admin | Define seat layout |
| POST | `/theatre-admin/create-screen` | Theatre Admin | Add screen to theatre |
| POST | `/theatre-admin/create-show` | Theatre Admin | Schedule a show |
| GET | `/users/movie/{id}/theatre` | — | Theatres showing a movie |
| GET | `/users/show/{id}` | — | Show details + seat layout |
| POST | `/users/show/{id}/seat-lock` | User | Lock seats (10-min TTL) |
| POST | `/users/show/{id}/seat-book` | User | Book locked seats |
| POST | `/users/booking/{id}/cancel` | User | Cancel booking |
| GET | `/search/{query}` | — | Search movies & theatres |

## Project Structure

```
app/
├── api/v1/           # Route handlers
├── core/             # Config, Redis, auth dependencies
├── db/               # Async engine + session
├── middlewares/       # Rate limiting, exception handling
├── models/           # SQLAlchemy models (15 tables)
├── repositories/     # Database operations
├── schemas/          # Pydantic request/response models
├── services/         # Business logic (auth, booking, search, email)
├── templates/        # Email templates
└── utils/            # JWT, encryption helpers

tests/                # 58 tests (unit, integration, concurrency, edge cases)
load_tests/           # Locust load test suite (200-user contention test)
alembic/              # Database migrations
```

## Testing

```bash
# Run all tests
uv run pytest tests/ -v

# Run load test (requires running server)
uv run python load_tests/seed.py
uv run python -m locust -f load_tests/locustfile.py --host http://localhost:8000 --headless -u 200 -r 20 --run-time 60s
uv run python load_tests/verify.py
```

## License

[MIT](LICENSE)
