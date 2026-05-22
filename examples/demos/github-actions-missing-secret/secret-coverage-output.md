# Secret Coverage Report

Readiness score: **73/100**

Critical: 1 · Warning: 0 · Info: 1

## Critical

- **STRIPE_SECRET_KEY** — STRIPE_SECRET_KEY is used in .github/workflows/deploy.yml but missing from an env template.
  - Context: `.github/workflows/deploy.yml` · `missing-from-template`
  - Fix: Add STRIPE_SECRET_KEY= to an env template and configure the value in your deployment environment.

## Info

- **DATABASE_URL** — DATABASE_URL is documented in an env template but not present in local env files.
  - Context: `declared-not-local`
  - Fix: Set DATABASE_URL locally before running builds that require it.


Command exit code: 1
