# Catch a missing Redis URL in Docker Compose before deploy

A small Docker Compose stack can drift in the same way as CI/CD config: a service starts relying on a new environment variable, but the repository's env template does not document it.

Secret Coverage is meant to catch that contract mismatch before the first warning sign is a failed local preview, worker boot, or deployment job.

## Demo fixture

This repo includes a minimal fixture at:

```txt
examples/demos/docker-compose-missing-redis-url/
├── .env.example
└── docker-compose.yml
```

The Compose file references `REDIS_URL` in both the web service and worker:

```yaml
services:
  web:
    environment:
      APP_ENV: ${APP_ENV}
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}

  worker:
    environment:
      REDIS_URL: ${REDIS_URL}
```

But `.env.example` intentionally documents only:

```dotenv
APP_ENV=production
DATABASE_URL=
```

That means `REDIS_URL` is required by the runtime/deployment config, but missing from the declared env template.

## Run the check

From the Secret Coverage repository root:

```bash
pnpm scan -- --path examples/demos/docker-compose-missing-redis-url --ci
```

## Screenshot-ready output

```md
# Secret Coverage Report

Readiness score: **71/100**

Critical: 1 · Warning: 0 · Info: 2

## Critical

- **REDIS_URL** — REDIS_URL is used in docker-compose.yml but missing from an env template.
  - Context: `docker-compose.yml` · `missing-from-template`
  - Fix: Add REDIS_URL= to an env template and configure the value in your deployment environment.
```

## Why this matters

This is a metadata-only deployment readiness check. Secret Coverage does not need the Redis connection string value. It only checks which environment variables are documented, which ones deployment/config files reference, and whether the declared contract is complete.

That makes the check useful for:

- Docker Compose deployment readiness;
- PR review of AI-generated service and worker config changes;
- catching environment drift before a failed deploy or local preview;
- keeping `.env.example` or `.env.dist` aligned with runtime requirements.

## Fix

Add the missing key to the env template and configure the real value in the runtime/deployment environment:

```dotenv
APP_ENV=production
DATABASE_URL=
REDIS_URL=
```

Then rerun:

```bash
pnpm scan -- --path examples/demos/docker-compose-missing-redis-url --ci
```

The goal is not to expose secret values. The goal is to catch missing deployment assumptions while the fix is still small.
