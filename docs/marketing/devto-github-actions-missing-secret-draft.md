# Dev.to draft — Two tiny deployment drift bugs

Status: reviewed for link readiness, but still draft only. Do not publish until Darius reviews channel framing.

## Goal

Turn the repo-hosted demo assets into a useful Dev.to post for developers who have seen deployments fail because CI/CD or runtime config referenced an env var that was not documented in `.env.example` / `.env.dist`.

Positioning: deployment drift detection / CI/CD environment validation / deployment readiness. Avoid generic security-tool framing and avoid broad claims.

## Title options

1. `Two tiny deployment drift bugs: env vars added, templates forgotten`
2. `Catch missing environment variables before your deploy job does`
3. `How env templates drift from CI/CD and Docker config`
4. `Stop finding missing env vars only after your deploy job fails`

Recommended first title: **Two tiny deployment drift bugs: env vars added, templates forgotten**

## Tags

Recommended Dev.to tags:

- `devops`
- `githubactions`
- `docker`
- `opensource`

Optional swap if the post leans more AI-agent focused: replace `docker` with `ai`.

## Canonical links / assets

Use these after the demo/article assets are committed and visible on GitHub:

- npm: `https://www.npmjs.com/package/@leviro-ai/secret-coverage`
- GitHub repo: `https://github.com/leviro-ai/secret-coverage`
- GitHub Actions demo fixture: `https://github.com/leviro-ai/secret-coverage/tree/main/examples/demos/github-actions-missing-secret`
- GitHub Actions article source: `https://github.com/leviro-ai/secret-coverage/blob/main/docs/articles/github-actions-missing-secret.md`
- Docker Compose demo fixture: `https://github.com/leviro-ai/secret-coverage/tree/main/examples/demos/docker-compose-missing-redis-url`
- Docker Compose article source: `https://github.com/leviro-ai/secret-coverage/blob/main/docs/articles/docker-compose-missing-redis-url.md`
- Optional Vercel demo fixture, if adding one breadth note only: `https://github.com/leviro-ai/secret-coverage/tree/main/examples/demos/vercel-missing-supabase-key`
- Optional CircleCI demo fixture, if adding one breadth note only: `https://github.com/leviro-ai/secret-coverage/tree/main/examples/demos/circleci-missing-deploy-key`

Link-readiness review 2026-05-23: npm latest is `0.1.5`, the repository has the pushed demo/article assets, and the GitHub URLs above should resolve on `main`.

## Draft body

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

Optional breadth note, only if Darius wants it:

There are a few more small fixture examples in the repo, including Vercel config drift and CircleCI deploy-key drift, but I would keep this first post focused on the two cases above.

- Vercel demo: https://github.com/leviro-ai/secret-coverage/tree/main/examples/demos/vercel-missing-supabase-key
- CircleCI demo: https://github.com/leviro-ai/secret-coverage/tree/main/examples/demos/circleci-missing-deploy-key

## Pre-publish checklist

- [ ] Confirm current working tree changes are committed/pushed so GitHub demo links resolve.
- [ ] Re-run `pnpm scan -- --path examples/demos/github-actions-missing-secret --ci` and confirm output still matches the quoted report.
- [ ] Re-run `pnpm scan -- --path examples/demos/docker-compose-missing-redis-url --ci` and confirm output still matches the quoted report.
- [ ] If using the optional Vercel/CircleCI breadth note, verify those two GitHub links and demo scans too.
- [ ] Verify npm latest is still `@leviro-ai/secret-coverage@0.1.5` or update wording if a new version exists.
- [ ] Keep tone educational; do not claim users, traction, testimonials, or comparisons that do not exist.
- [ ] Publish as a helpful technical note, not as launch spam.
- [ ] After posting, record the URL and real observable metrics in `docs/marketing/metrics-log.md`.

## Reuse notes for other channels

- Reddit: rewrite as a discussion prompt around deployment drift and only link if subreddit rules allow it.
- Hacker News: still wait for a stronger public artifact or Show HN angle; avoid submitting a thin promo link.
- X/Twitter: use a short thread with one YAML/env mismatch and one screenshot-ready report snippet, then link to the full Dev.to post after it exists.
