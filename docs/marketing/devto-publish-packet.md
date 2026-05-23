# Dev.to publish packet — two deployment drift demos

Status: ready-for-approval packet only. Do **not** publish until Darius approves the channel and final wording.

This packet condenses the approved-first-post recommendation into copy/paste fields for the already-open Dev.to session. It intentionally keeps the main post focused on two concrete examples and treats Vercel/CircleCI as optional follow-up links only.

## Copy/paste fields

Title:

```txt
Two tiny deployment drift bugs: env vars added, templates forgotten
```

Tags:

```txt
devops, githubactions, docker, opensource
```

Canonical URL: leave blank unless Darius wants the GitHub article source to be canonical.

## Body

````md
A small deployment failure pattern I keep seeing:

1. A config file starts using a new environment variable or secret.
2. The repo's `.env.example` or `.env.dist` is not updated.
3. The mismatch is discovered later, usually during a deploy job, local preview, worker boot, or production config check.

The bug is rarely dramatic in code review. It can be as small as one extra variable in CI/CD or Docker config.

### Example 1: GitHub Actions secret drift

A workflow starts using a new secret:

```yaml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
```

But the env template only documents this:

```dotenv
NEXT_PUBLIC_APP_URL=https://example.com
DATABASE_URL=
```

Now `STRIPE_SECRET_KEY` has become an undocumented deployment requirement.

Run the demo fixture with Secret Coverage:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path examples/demos/github-actions-missing-secret --ci
```

In the repo itself, the equivalent dev command is:

```bash
pnpm scan -- --path examples/demos/github-actions-missing-secret --ci
```

Expected output:

```md
# Secret Coverage Report

Readiness score: **73/100**

Critical: 1 · Warning: 0 · Info: 1

## Critical

- **STRIPE_SECRET_KEY** — STRIPE_SECRET_KEY is used in .github/workflows/deploy.yml but missing from an env template.
  - Context: `.github/workflows/deploy.yml` · `missing-from-template`
  - Fix: Add STRIPE_SECRET_KEY= to an env template and configure the value in your deployment environment.
```

### Example 2: Docker Compose runtime drift

The same thing can happen outside CI. A Compose file starts expecting Redis:

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

But `.env.example` only documents:

```dotenv
APP_ENV=production
DATABASE_URL=
```

Now both the web service and worker depend on `REDIS_URL`, but the repository contract does not say so.

Run the demo fixture:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path examples/demos/docker-compose-missing-redis-url --ci
```

Expected output:

```md
# Secret Coverage Report

Readiness score: **71/100**

Critical: 1 · Warning: 0 · Info: 2

## Critical

- **REDIS_URL** — REDIS_URL is used in docker-compose.yml but missing from an env template.
  - Context: `docker-compose.yml` · `missing-from-template`
  - Fix: Add REDIS_URL= to an env template and configure the value in your deployment environment.
```

That is deployment drift: deployment/runtime config expects something the repository's declared env contract does not describe.

The point is not to read or expose secret values. The check only compares metadata:

- variables documented by env templates;
- variables referenced by CI/CD, Docker, and config files;
- mismatches that should be fixed before deployment.

A minimal fix is to update the env template:

```dotenv
# GitHub Actions example
NEXT_PUBLIC_APP_URL=https://example.com
DATABASE_URL=
STRIPE_SECRET_KEY=

# Docker Compose example
APP_ENV=production
DATABASE_URL=
REDIS_URL=
```

Then configure the real values in GitHub Actions secrets, Docker/Compose runtime environment, or the deployment platform.

This is especially useful when AI-assisted PRs update application code and config quickly, because env contracts are easy to forget during review.

Secret Coverage is local-first and deterministic. It is not a vault and it does not need a cloud account for this check.

Links:

- npm: https://www.npmjs.com/package/@leviro-ai/secret-coverage
- GitHub: https://github.com/leviro-ai/secret-coverage
- GitHub Actions demo: https://github.com/leviro-ai/secret-coverage/tree/main/examples/demos/github-actions-missing-secret
- Docker Compose demo: https://github.com/leviro-ai/secret-coverage/tree/main/examples/demos/docker-compose-missing-redis-url
````

## Optional breadth note

Use only if Darius approves mentioning the later demos. Add this after the main links:

```md
There are a few more small fixture examples in the repo, including Vercel config drift and CircleCI deploy-key drift, but I would keep this first post focused on the two cases above.

- Vercel demo: https://github.com/leviro-ai/secret-coverage/tree/main/examples/demos/vercel-missing-supabase-key
- CircleCI demo: https://github.com/leviro-ai/secret-coverage/tree/main/examples/demos/circleci-missing-deploy-key
```

## Pre-publish checks

Run these immediately before publishing after Darius approves:

```bash
pnpm scan -- --path examples/demos/github-actions-missing-secret --ci
pnpm scan -- --path examples/demos/docker-compose-missing-redis-url --ci
npm view @leviro-ai/secret-coverage version --json
```

If using the optional breadth note, also run:

```bash
pnpm scan -- --path examples/demos/vercel-missing-supabase-key --ci
pnpm scan -- --path examples/demos/circleci-missing-deploy-key --ci
```

Expected scan result for each demo: command exits non-zero because the demo intentionally contains a missing env-template entry; the finding should name only the variable and config file, never a raw secret value.

After publishing, record only the real Dev.to URL and visible metrics in `docs/marketing/metrics-log.md`.
