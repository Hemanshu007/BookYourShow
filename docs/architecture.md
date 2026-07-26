# Architecture

## Overview

```
Client → FastAPI Routes → Services → Repositories → PostgreSQL
                ↓                              ↑
            Redis (cache/lock)        Elasticsearch (search)
```

## Layers

| Layer | Responsibility |
|-------|---------------|
| **Routes** | Handle HTTP requests/responses, input validation |
| **Services** | Business logic, orchestration, Redis operations |
| **Repositories** | Database queries, SQLAlchemy operations |
| **Models** | Database schema definitions |
| **Schemas** | Pydantic request/response models |

## Authentication Flow

### OTP Login

1. User enters email → `POST /auth/send-otp`
2. OTP generated, stored in Redis (5-min TTL), sent via email
3. User submits OTP → `POST /auth/signin`
4. OTP validated and removed from Redis
5. JWT access + refresh tokens returned

### Google OAuth

1. User redirected to Google consent screen
2. Callback receives authorization code
3. Code exchanged for user info (email, name)
4. User created or matched → JWT tokens returned

## Role & Permission System

```
admin         → full access (create/delete users, theatres, movies, screens, shows)
theatre_admin → manage own theatres (layouts, screens, shows)
user          → browse, lock seats, book tickets
```

Permissions are checked via FastAPI dependencies before route handlers execute.

## Seat Locking (Concurrency Control)

```
1. User A calls POST /seat-lock  → Redis hsetnx("A1", user_a) → True
2. User B calls POST /seat-lock  → Redis hsetnx("A1", user_b) → False → Rejected
3. User A calls POST /seat-book  → DB check (no existing booking for A1) → Write booking
4. Lock deleted, layout updated to "Booked"
```

**Defense in depth:**
- Layer 1: Redis atomic `hsetnx` (prevents concurrent locks)
- Layer 2: DB query inside transaction (prevents booking already-booked seats)
- Layer 3: Partial unique index on `(seats_number, show_id) WHERE NOT is_cancelled`

## Search System

- Elasticsearch stores movie and theatre data
- Auto-syncs on insert/update via `SearchSyncService`
- Prefix-based search with relevance scoring
- Fallback: if ES is down, search returns empty (graceful degradation)

## Caching Strategy

| What | Where | TTL |
|------|-------|-----|
| OTP codes | Redis hash | 5 min |
| Seat locks | Redis hash | 10 min |
| Seat layouts | Redis JSON | until show time |
| Booked seats | Redis hash (booked seats map) | until show time |

Layout falls back to DB generation if not in cache.

## Database Schema

15 tables with full audit trail (`created_at`, `updated_at`), soft deletes (`is_deleted`), and foreign key constraints. Key tables:

- `users` + `user_details` — authentication and profile
- `roles` + `permissions` + `roles_permissions_map` — RBAC
- `theatres` + `theatre_operators_map` — theatre ownership
- `layouts` + `screens` — venue structure
- `movies` — film catalog
- `shows` — scheduled screenings
- `bookings` + `booked_seats_map` + `booked_tickets` — reservations
