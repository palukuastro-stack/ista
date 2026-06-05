# ISTA PORTAL — University Management Platform

## Project Overview

Full-stack university management platform for ISTA-GOMA (Institut Supérieur de Techniques Appliquées de Goma, DRC).

**Architecture:**
- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS (port 5000)
- **Backend:** Go 1.25 + Gin microservices API (port 8080)
- **Database:** PostgreSQL (Replit managed, via `DATABASE_URL`)
- **Auth:** JWT (HS256) + bcrypt passwords + Resend email service

## Running the Project

Two workflows run in parallel:
1. **Start application** — `npm run dev` → frontend on port 5000
2. **Backend API** — `cd backend && go run ./cmd/server` → API on port 8080

The Vite dev server proxies `/api/*` → `http://localhost:8080`, so the frontend calls `/api/v1/...` transparently.

## Demo Login Credentials

All seed accounts use the password: **`Ista@2024!`**

| Email | Role |
|-------|------|
| aline.mukamana@ista-goma.cd | Étudiante |
| jp.bahati@ista-goma.cd | Enseignant |
| espoir.kambale@ista-goma.cd | Apparitorat |
| grace.furaha@ista-goma.cd | Secrétariat Faculté |
| innocent.byamungu@ista-goma.cd | Secrétariat Général |
| christine.mwamini@ista-goma.cd | Rectorat |

## Key Files

- `vite.config.ts` — Vite proxy config (`/api` → backend)
- `src/lib/api.ts` — Full HTTP client; auto-unwraps Go response envelope `{ success, data }`
- `src/contexts/AuthContext.tsx` — JWT auth context; validates token via `/auth/me` on mount
- `backend/cmd/server/main.go` — Go entry point
- `backend/internal/config/config.go` — Reads env vars
- `backend/internal/database/migrations/` — SQL migrations + seed data

## Backend Module

Go module: `github.com/ista-goma/platform`

## Environment Variables

Set in Replit Secrets:
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — HMAC secret for JWT signing
- `JWT_EXPIRY_HOURS` — Token lifetime (default 24)
- `RESEND_API_KEY` — For transactional email (optional in dev)
- `EMAIL_FROM_NAME` — Sender display name
- `FRONTEND_URL` — Used in reset/activation email links
- `PORT` — Backend port (default 8080)

## User Preferences

- Keep all comments minimal — no excessive inline comments
- Prefer parallel tool calls for speed
- TypeScript strict mode; fix all TS errors before delivering
