# EnvGuard Report

Readiness score: **42/100**

Critical: 2 · Warning: 1 · Info: 0

## Critical

- **NEXT_PUBLIC_API_URL** — NEXT_PUBLIC_API_URL is used in .github/workflows/deploy.yml but missing from .env.example.
  - Context: `.github/workflows/deploy.yml` · `missing-from-example`
  - Fix: Add NEXT_PUBLIC_API_URL= to .env.example and configure the value in your deployment environment.
- **SUPABASE_SERVICE_ROLE_KEY** — SUPABASE_SERVICE_ROLE_KEY appears to contain a real secret in .env.local.
  - Context: `.env.local` · `plaintext-secret`
  - Fix: Remove SUPABASE_SERVICE_ROLE_KEY from committed files, rotate the value if it was pushed, and keep only an empty placeholder in .env.example.

## Warning

- **SUPABASE_SERVICE_ROLE_KEY** — SUPABASE_SERVICE_ROLE_KEY exists in a local env file but is not referenced by supported project configs.
  - Context: `unused-local-variable`
  - Fix: Remove SUPABASE_SERVICE_ROLE_KEY if obsolete, or add it to .env.example if it is required at runtime.

