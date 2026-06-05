# ISTA-GOMA Platform — Backend API

REST API backend for the ISTA-GOMA university platform, built with **Go 1.25** and **Gin**.

## Architecture

```
backend/
├── cmd/server/main.go          # Entry point — wires all services together
├── internal/
│   ├── config/                 # Environment variable loading
│   ├── database/               # PostgreSQL connection pool + SQL migrations
│   ├── middleware/             # JWT auth, CORS, request logging
│   ├── domain/                 # Core business entities (no framework deps)
│   ├── auth/                   # Login, activation, password reset
│   ├── academic/               # Faculties, promotions, courses, schedules, rooms
│   ├── students/               # Student profiles and enrollment
│   ├── teachers/               # Teacher profiles
│   ├── grades/                 # Grades, appeals, assignments, submissions, resources
│   ├── notifications/          # In-app notifications and announcements
│   └── email/                  # Resend email delivery + templates
└── pkg/
    ├── response/               # Standardized JSON response helpers
    └── apperror/               # Typed application errors
```

Each domain package follows the same 3-layer structure:
- **repository** — raw SQL queries, no business logic
- **service** — business rules, validation, notifications
- **handler** — HTTP binding, delegates to service, translates errors

## Prerequisites

- Go 1.25+
- PostgreSQL 14+

## Setup

```bash
# 1. Copy and fill in the environment file
cp .env.example .env

# 2. Create the database
createdb ista_goma

# 3. Apply migrations
psql $DATABASE_URL -f internal/database/migrations/001_init.up.sql
psql $DATABASE_URL -f internal/database/migrations/002_seed.up.sql

# 4. Run the server
go run ./cmd/server
```

## Environment Variables

| Variable              | Required | Default       | Description                         |
|-----------------------|----------|---------------|-------------------------------------|
| `DATABASE_URL`        | ✓        | —             | PostgreSQL connection string        |
| `JWT_SECRET`          | ✓        | —             | HMAC-SHA256 signing secret          |
| `PORT`                |          | `8080`        | HTTP server port                    |
| `APP_ENV`             |          | `development` | `development` or `production`       |
| `JWT_EXPIRY_HOURS`    |          | `24`          | JWT token lifetime in hours         |
| `RESEND_API_KEY`      |          | —             | Resend API key (empty = dry-run)    |
| `EMAIL_FROM_NAME`     |          | `ISTA-GOMA`   | Sender display name                 |
| `EMAIL_FROM_ADDR`     |          | —             | Sender email address                |
| `FRONTEND_URL`        |          | `http://localhost:5000` | Used in email links       |

## API Endpoints

All endpoints are prefixed with `/api/v1`.

### Auth (public)
| Method | Path                          | Description                    |
|--------|-------------------------------|--------------------------------|
| POST   | `/auth/login`                 | Email/password login → JWT     |
| GET    | `/auth/me`                    | Current user profile           |
| POST   | `/auth/logout`                | Session teardown (stateless)   |
| POST   | `/auth/forgot-password`       | Send reset link via email      |
| POST   | `/auth/reset-password`        | Consume reset token            |
| POST   | `/auth/activate`              | Activate account with token    |

### Academic (authenticated)
| Method | Path                          | Description                    |
|--------|-------------------------------|--------------------------------|
| GET    | `/faculties`                  | List all faculties             |
| POST   | `/faculties`                  | Create faculty                 |
| PUT    | `/faculties/:id`              | Update faculty                 |
| DELETE | `/faculties/:id`              | Delete faculty                 |
| GET    | `/promotions`                 | List promotions (filter: facultyId) |
| POST   | `/promotions`                 | Create promotion               |
| GET    | `/courses`                    | List courses (filters)         |
| POST   | `/courses`                    | Create course                  |
| PATCH  | `/courses/:id/teacher`        | Assign teacher to course       |
| GET    | `/schedules`                  | List schedule slots            |
| POST   | `/schedules`                  | Create slot (conflict check)   |
| GET    | `/rooms`                      | List rooms                     |
| POST   | `/rooms`                      | Create room                    |

### Students (authenticated)
| Method | Path                          | Description                    |
|--------|-------------------------------|--------------------------------|
| GET    | `/students`                   | List (filter: facultyId, promotionId, status) |
| POST   | `/students`                   | Create student (auto-matricule)|
| PUT    | `/students/:id`               | Update profile                 |
| PATCH  | `/students/:id/status`        | Change enrollment status       |

### Teachers (authenticated)
| Method | Path                          | Description                    |
|--------|-------------------------------|--------------------------------|
| GET    | `/teachers`                   | List (filter: facultyId)       |
| GET    | `/teachers/titles`            | Available academic titles      |
| POST   | `/teachers`                   | Create teacher (auto-matricule)|
| PUT    | `/teachers/:id`               | Update profile                 |

### Grades (authenticated)
| Method | Path                          | Description                    |
|--------|-------------------------------|--------------------------------|
| GET    | `/grades`                     | List (filter: studentId, courseId) |
| POST   | `/grades`                     | Upsert grade (triggers notification) |
| PATCH  | `/grades/:id/status`          | Validate/reject grade          |
| GET    | `/appeals`                    | List grade appeals             |
| POST   | `/appeals`                    | Submit appeal (triggers notification) |
| PATCH  | `/appeals/:id/resolve`        | Resolve appeal                 |
| GET    | `/assignments`                | List assignments               |
| POST   | `/assignments`                | Create assignment              |
| DELETE | `/assignments/:id`            | Remove assignment              |
| GET    | `/submissions`                | List submissions               |
| POST   | `/submissions`                | Submit work                    |
| PATCH  | `/submissions/:id/grade`      | Grade a submission             |
| GET    | `/resources`                  | List course resources          |
| POST   | `/resources`                  | Add resource                   |
| DELETE | `/resources/:id`              | Remove resource                |

### Notifications (authenticated)
| Method | Path                          | Description                    |
|--------|-------------------------------|--------------------------------|
| GET    | `/notifications`              | List for current user's role   |
| PATCH  | `/notifications/:id/read`     | Mark one as read               |
| PATCH  | `/notifications/read-all`     | Mark all as read               |
| GET    | `/announcements`              | List announcements             |
| POST   | `/announcements`              | Publish announcement           |

## Response Envelope

Every response uses the same JSON envelope:

```json
{
  "success": true,
  "data": { ... },
  "message": "optional message",
  "error": "only present on error",
  "meta": {
    "page": 1,
    "perPage": 20,
    "total": 100,
    "pages": 5
  }
}
```

## Security

- **Authentication**: HMAC-SHA256 JWT (`Authorization: Bearer <token>`)
- **Passwords**: bcrypt with cost factor 10
- **Account activation**: time-limited tokens (72 h) sent via email
- **Password reset**: time-limited tokens (2 h) sent via email
- **No password in plain text**: never transmitted or stored
- **CORS**: restricted to configured `FRONTEND_URL`
