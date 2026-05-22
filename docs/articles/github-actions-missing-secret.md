# Catch a missing GitHub Actions secret before deploy

A common deployment drift failure is simple: a workflow starts using a new secret, but the repository's environment contract is not updated. The build may pass locally and then fail only when GitHub Actions tries to deploy.

Secret Coverage is meant to catch that contract mismatch before the deploy job becomes the first warning sign.

## Demo fixture

This repo now includes a minimal fixture at:

```txt
examples/demos/github-actions-missing-secret/
├── .env.example
└── .github/workflows/deploy.yml
```

The workflow references a deployment secret:

```yaml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
```

But `.env.example` intentionally documents only:

```dotenv
NEXT_PUBLIC_APP_URL=https://example.com
DATABASE_URL=
```

That means `STRIPE_SECRET_KEY` is required by CI/CD, but missing from the declared env template.

## Run the check

From the Secret Coverage repository root:

```bash
pnpm scan -- --path examples/demos/github-actions-missing-secret --ci
```

## Screenshot-ready output

```md
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
```

## Why this matters

This is a metadata-only deployment readiness check. Secret Coverage does not need to know the secret value. It only checks which environment variables are documented, which ones deployment files reference, and whether the declared contract is complete.

That makes the check useful for:

- GitHub Actions deployment readiness;
- PR review of AI-generated config changes;
- catching CI/CD environment drift before a failed deploy;
- keeping `.env.example` or `.env.dist` aligned with real deployment requirements.

## Fix

Add the missing key to the env template and configure the real value in the deployment environment:

```dotenv
NEXT_PUBLIC_APP_URL=https://example.com
DATABASE_URL=
STRIPE_SECRET_KEY=
```

Then rerun:

```bash
pnpm scan -- --path examples/demos/github-actions-missing-secret --ci
```

The goal is not to expose secret values. The goal is to catch missing deployment assumptions while the fix is still small.
