---
name: Go response envelope
description: All Go backend responses are wrapped in { success, data }; api.ts must unwrap them
---

The Go backend uses a response helper that always wraps data in:
```json
{ "success": true, "data": <actual payload> }
```

The `src/lib/api.ts` `request<T>` function auto-unwraps this envelope:
```typescript
const envelope = await res.json() as ApiEnvelope<T>
if (envelope.data !== undefined) return envelope.data
return envelope as unknown as T
```

**Why:** All typed API interfaces (e.g. `Faculty[]`, `LoginResponse`) are typed as the inner payload, not the wrapper. Without auto-unwrapping, every call site would get the wrong shape.

**How to apply:** Never add `.data` access in call sites — it's handled in `request<T>`. If the backend response shape changes to not use the envelope, update the unwrap logic in `api.ts`.
