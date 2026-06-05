# Agent Memory Index

- [Go backend response envelope](go-response-envelope.md) — all Go API responses are wrapped in `{ success, data }`; api.ts auto-unwraps this
- [Auth seed credentials](auth-seed-credentials.md) — seed users need active=TRUE + user_credentials row; dev password is Ista@2024!
- [Vite proxy for backend](vite-proxy.md) — frontend uses Vite proxy `/api` → `http://localhost:8080`; no VITE_API_URL env var needed in dev
