# Secret Coverage Report

Readiness score: **73/100**

Critical: 1 · Warning: 0 · Info: 1

## Critical

- **STRIPE_SECRET_KEY** — STRIPE_SECRET_KEY is used in src/app/api/checkout/route.ts but missing from an env template.
  - Context: `src/app/api/checkout/route.ts` · `missing-from-template`
  - Fix: Add STRIPE_SECRET_KEY= to an env template and configure the value in your deployment environment.

## Info

- **NEXT_PUBLIC_APP_URL** — NEXT_PUBLIC_APP_URL is documented in an env template but not present in local env files.
  - Context: `declared-not-local`
  - Fix: Set NEXT_PUBLIC_APP_URL locally before running builds that require it.

Command exit code: 1
