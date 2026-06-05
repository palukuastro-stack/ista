---
name: Vite proxy for backend
description: Frontend routes /api/* to the Go backend via Vite dev server proxy; no env var needed
---

`vite.config.ts` proxies all `/api` requests to `http://localhost:8080`:
```typescript
proxy: {
  "/api": { target: "http://localhost:8080", changeOrigin: true }
}
```

`src/lib/api.ts` uses `BASE_URL = VITE_API_URL ?? "/api"`, so in dev no env var is needed — the proxy handles it.

**Why:** Avoids CORS issues and keeps API calls relative, which also works in production with a proper reverse proxy (Nginx etc.).

**How to apply:** In production deployment, ensure the web server reverse-proxies `/api` to the Go backend on whatever port it runs on.
