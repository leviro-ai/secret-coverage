# Secret Coverage Report

Readiness score: **71/100**

Critical: 1 · Warning: 0 · Info: 2

## Critical

- **REDIS_URL** — REDIS_URL is used in docker-compose.yml but missing from an env template.
  - Context: `docker-compose.yml` · `missing-from-template`
  - Fix: Add REDIS_URL= to an env template and configure the value in your deployment environment.

## Info

- **APP_ENV** — APP_ENV is documented in an env template but not present in local env files.
  - Context: `declared-not-local`
  - Fix: Set APP_ENV locally before running builds that require it.
- **DATABASE_URL** — DATABASE_URL is documented in an env template but not present in local env files.
  - Context: `declared-not-local`
  - Fix: Set DATABASE_URL locally before running builds that require it.

Command exit code: 1
