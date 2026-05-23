# Secret Coverage Report

Readiness score: **73/100**

Critical: 1 · Warning: 0 · Info: 1

## Critical

- **DEPLOY_TOKEN** — DEPLOY_TOKEN is used in .gitlab-ci.yml but missing from an env template.
  - Context: `.gitlab-ci.yml` · `missing-from-template`
  - Fix: Add DEPLOY_TOKEN= to an env template and configure the value in your deployment environment.

## Info

- **NEXT_PUBLIC_APP_URL** — NEXT_PUBLIC_APP_URL is documented in an env template but not present in local env files.
  - Context: `declared-not-local`
  - Fix: Set NEXT_PUBLIC_APP_URL locally before running builds that require it.

