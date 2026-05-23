# Docker Compose environment variable troubleshooting

Docker Compose failures around missing environment variables usually start as a small contract drift problem: `docker-compose.yml` references a variable, but the repo's env template does not document it.

Secret Coverage catches that deployment drift before a developer, CI job, preview stack, or worker process becomes the first place that discovers the missing value.

## Quick symptom checklist

Use this checklist when a Compose stack works for one developer but fails in another shell, CI runner, preview app, or deployment host:

- `docker-compose.yml` or `compose.yml` contains `${SOME_VAR}`;
- `.env.example` or `.env.dist` does not include `SOME_VAR=`;
- the variable exists in one developer's local shell but not in CI or the deploy environment;
- a worker or sidecar service needs the same variable as the web service;
- reviewers cannot tell whether the variable is required, optional, or stale.

The safest fix is to update the metadata contract first, without copying real secret values into documentation.

## Minimal example

This repository includes a small fixture at:

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

But the env template documents only:

```dotenv
APP_ENV=production
DATABASE_URL=
```

That means `REDIS_URL` is a runtime requirement, but the repo-visible contract does not tell reviewers, CI setup owners, or deploy operators to configure it.

## Reproduce the check

From the Secret Coverage repo root:

```bash
pnpm scan -- --path examples/demos/docker-compose-missing-redis-url --ci
```

Expected result: the command exits non-zero because `docker-compose.yml` references `REDIS_URL` and the env template does not document it.

## What the report tells you

The important finding is metadata-only:

```md
- **REDIS_URL** — REDIS_URL is used in docker-compose.yml but missing from an env template.
  - Context: `docker-compose.yml` · `missing-from-template`
  - Fix: Add REDIS_URL= to an env template and configure the value in your deployment environment.
```

Secret Coverage reports the variable name, file path, finding type, and recommended fix. It does not need to print or collect the Redis password, DSN, or any other raw secret value.

## Safe fix pattern

1. Add the missing variable name to the env template:

   ```dotenv
   APP_ENV=production
   DATABASE_URL=
   REDIS_URL=
   ```

2. Configure the real value in the place that runs the Compose stack: local `.env`, CI variables, preview environment, or deployment platform.
3. Re-run the metadata check before deploy:

   ```bash
   pnpm scan -- --ci
   ```

4. If the variable is optional, document the default or intentionally empty behavior near the Compose service so reviewers know the difference between optional config and drift.

## PR review questions

For Docker Compose changes, reviewers can ask:

- Did this PR add a new `${VAR}` reference in `docker-compose.yml`, `compose.yml`, or service-specific env blocks?
- Is the variable documented in `.env.example` or `.env.dist`?
- Is the variable required by web, worker, and migration services consistently?
- Does CI fail before deploy if the env contract is incomplete?
- Are we documenting only variable names and metadata, not raw secret values?

## Why this prevents repeated Compose failures

A missing `REDIS_URL` can look like a local Docker problem, a worker startup bug, or a deploy-platform issue. The recurring problem is simpler: deployment configuration drifted away from the env template. Secret Coverage makes that drift visible in review and CI, so the fix stays small and safe.

Related assets:

- [Docker Compose missing Redis URL demo](docker-compose-missing-redis-url.md)
- [CI/CD environment variable validation checklist](ci-cd-env-validation-checklist.md)
- [AI-agent PR environment review walkthrough](ai-agent-pr-env-review-walkthrough.md)
