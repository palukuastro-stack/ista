---
name: Auth seed credentials
description: Seed users require active=TRUE in users table AND a row in user_credentials to log in
---

The Go auth service Login() has two checks before password validation:
1. `user.Active` must be `TRUE` in the `users` table
2. A row must exist in `user_credentials` with `activated_at` not NULL

The seed migration (`002_seed.up.sql`) creates all 6 demo users with `active = TRUE` and inserts their credentials in `user_credentials`.

**Dev password:** `Ista@2024!`
**Bcrypt hash (cost 10):** `$2a$10$SE9zo7P/6netLVEXLMpNpOeshWET96VBHfB7CLYYNYx8nmA9DTGwK`

**Why:** If only `user_credentials` is seeded but `users.active = FALSE`, login returns "account not yet activated" silently. Both conditions must be true.

**How to apply:** When adding new seed users, always set `active = TRUE` in the `users` INSERT and add a matching row to `user_credentials`.
