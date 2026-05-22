# Secret Coverage Report

Readiness score: **73/100**

Critical: 1 · Warning: 0 · Info: 1

## Critical

- **SUPABASE_SERVICE_ROLE_KEY** — SUPABASE_SERVICE_ROLE_KEY is used in vercel.json but missing from an env template.
  - Context: `vercel.json` · `missing-from-template`
  - Fix: Add SUPABASE_SERVICE_ROLE_KEY= to an env template and configure the value in your deployment environment.

## Info

- **NEXT_PUBLIC_SITE_URL** — NEXT_PUBLIC_SITE_URL is documented in an env template but not present in local env files.
  - Context: `declared-not-local`
  - Fix: Set NEXT_PUBLIC_SITE_URL locally before running builds that require it.
