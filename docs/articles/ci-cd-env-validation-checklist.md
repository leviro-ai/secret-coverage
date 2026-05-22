# CI/CD environment variable validation checklist

Deployments often fail because the code and pipeline agree on a variable name, but the repository's environment contract does not. A workflow, Docker Compose service, or platform config starts using a new key; `.env.example` or `.env.dist` is not updated; and the first real signal arrives during deploy.

This checklist is a practical way to review CI/CD environment variable drift before it becomes a runtime failure.

## 1. Treat env templates as the contract

Your env template should describe every variable a contributor, preview environment, worker, or deploy job needs to know exists.

Common template names:

```txt
.env.example
.env.dist
.env.template
```

The template does not need real values. In fact, it should usually avoid them:

```dotenv
DATABASE_URL=
STRIPE_SECRET_KEY=
REDIS_URL=
NEXT_PUBLIC_APP_URL=https://example.com
```

The important part is that required variable names are visible and reviewable.

## 2. Check every deployment surface, not just application code

Environment drift can start in places that do not look like application logic:

- GitHub Actions workflow `env:` blocks and `${{ secrets.NAME }}` references;
- Docker Compose `${NAME}` interpolation;
- CircleCI `environment:` and shell command references;
- Vercel project config and framework build settings;
- Next.js config and server-side `process.env.NAME` usage;
- worker or queue process definitions.

A review that only searches source files can miss the deployment file that actually introduced the requirement.

## 3. Example: GitHub Actions secret added, template forgotten

Workflow:

```yaml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
```

Template:

```dotenv
NEXT_PUBLIC_APP_URL=https://example.com
DATABASE_URL=
```

`STRIPE_SECRET_KEY` is now required by CI/CD, but not documented in the env template.

Run the included Secret Coverage demo fixture:

```bash
pnpm scan -- --path examples/demos/github-actions-missing-secret --ci
```

Screenshot-ready finding:

```md
## Critical

- **STRIPE_SECRET_KEY** — STRIPE_SECRET_KEY is used in .github/workflows/deploy.yml but missing from an env template.
  - Context: `.github/workflows/deploy.yml` · `missing-from-template`
  - Fix: Add STRIPE_SECRET_KEY= to an env template and configure the value in your deployment environment.
```

## 4. Example: Docker Compose service added Redis, template forgotten

Compose config:

```yaml
services:
  web:
    environment:
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}

  worker:
    environment:
      REDIS_URL: ${REDIS_URL}
```

Template:

```dotenv
APP_ENV=production
DATABASE_URL=
```

`REDIS_URL` is required by both services, but the repository contract does not mention it.

Run the included demo fixture:

```bash
pnpm scan -- --path examples/demos/docker-compose-missing-redis-url --ci
```

Screenshot-ready finding:

```md
## Critical

- **REDIS_URL** — REDIS_URL is used in docker-compose.yml but missing from an env template.
  - Context: `docker-compose.yml` · `missing-from-template`
  - Fix: Add REDIS_URL= to an env template and configure the value in your deployment environment.
```

## 5. CI check: fail before deploy

For a repository using Secret Coverage, add a pre-deploy check before the real deployment step:

```yaml
name: secret-coverage

on:
  pull_request:
  push:
    branches: [main]

jobs:
  env-contract:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: pnpm dlx @leviro-ai/secret-coverage scan --path . --ci
```

Before a stable public action release, prefer the npm CLI or the repository's current `main` action reference in examples that live inside this repo.

## 6. Review checklist for pull requests

Use this when a PR touches deployment config, build config, workers, or AI-generated infrastructure changes:

- [ ] Did any new `process.env.NAME`, `${NAME}`, `${{ secrets.NAME }}`, or CI env reference appear?
- [ ] Is every required variable listed in `.env.example`, `.env.dist`, or the chosen template file?
- [ ] Are local-only values excluded from docs and public output?
- [ ] Are non-secret inline CI literals intentionally ignored or documented?
- [ ] Does the CI check run before the deploy step?
- [ ] Does the failure message tell the developer which template line to add?

## 7. What this check should not do

A trustworthy env validation check should not print raw secret values, require access to production secrets, or turn normal code identifiers into fake findings.

Secret Coverage keeps this metadata-only: it compares variable names referenced by code and deployment config against variable names declared in env templates and local env metadata. The goal is to catch deployment drift while the fix is still a one-line template update.

## Related demo fixtures

- `examples/demos/github-actions-missing-secret/`
- `examples/demos/docker-compose-missing-redis-url/`
- `examples/demos/vercel-missing-supabase-key/`
- `examples/demos/circleci-missing-deploy-key/`
