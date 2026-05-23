# AI-agent PR environment review walkthrough

AI-assisted coding makes it easier to change application code, CI files, Docker config, and deployment assumptions in the same pull request. The risky part is not that the agent wrote code. The risky part is that environment contracts are easy to miss when a PR adds a new runtime dependency.

This walkthrough shows a practical review flow for catching that drift before merge.

## Scenario

An AI agent opens a PR that looks reasonable at first glance:

- adds a Stripe-backed checkout deploy step to GitHub Actions;
- adds a Redis-backed worker in Docker Compose;
- updates code paths that expect those services to exist;
- does not update `.env.example`.

There may be no raw secret values in the diff. The problem is metadata drift: config now references variables that the repository template does not declare.

## Step 1: Review the env contract first

Start with the template file because it is the contract reviewers and future contributors see:

```dotenv
NEXT_PUBLIC_APP_URL=https://example.com
DATABASE_URL=
```

This template says the project expects `NEXT_PUBLIC_APP_URL` and `DATABASE_URL`. It does not mention a Stripe secret or Redis connection string.

## Step 2: Check deployment config, not only source code

The GitHub Actions workflow now references a new secret:

```yaml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
```

Docker Compose now references Redis in two services:

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

Both changes are normal. The bug is that `STRIPE_SECRET_KEY` and `REDIS_URL` became required deployment inputs without being added to the env template.

## Step 3: Run a metadata-only drift check

In this repository, the demo fixtures model those two review findings:

```bash
pnpm scan -- --path examples/demos/github-actions-missing-secret --ci
pnpm scan -- --path examples/demos/docker-compose-missing-redis-url --ci
```

For a consumer repo using the published package, the equivalent shape is:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path . --ci
```

The check compares variable names referenced by deployment/config files with variable names declared by env templates. It does not need production secret values.

## Step 4: Read the findings like a PR reviewer

GitHub Actions drift:

```md
## Critical

- **STRIPE_SECRET_KEY** — STRIPE_SECRET_KEY is used in .github/workflows/deploy.yml but missing from an env template.
  - Context: `.github/workflows/deploy.yml` · `missing-from-template`
  - Fix: Add STRIPE_SECRET_KEY= to an env template and configure the value in your deployment environment.
```

Docker Compose drift:

```md
## Critical

- **REDIS_URL** — REDIS_URL is used in docker-compose.yml but missing from an env template.
  - Context: `docker-compose.yml` · `missing-from-template`
  - Fix: Add REDIS_URL= to an env template and configure the value in your deployment environment.
```

These are useful review comments because they point to the missing contract update, not to a vague deployment failure.

## Step 5: Ask for the smallest safe PR fix

The fix is usually a tiny template update:

```dotenv
NEXT_PUBLIC_APP_URL=https://example.com
DATABASE_URL=
STRIPE_SECRET_KEY=
REDIS_URL=
```

Then the real values still belong in the deployment platform:

- GitHub Actions secrets for CI/CD secrets;
- Docker or Compose runtime environment for service variables;
- Vercel, CircleCI, or another platform's environment settings where relevant.

Do not put raw secret values into `.env.example`, docs, screenshots, or review comments.

## Step 6: Add the check before merge

A small GitHub Actions check can fail the PR before the deploy job discovers the mismatch:

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

For this repository's own demos, keep using the local command with the pnpm argument separator:

```bash
pnpm scan -- --path examples/demos/github-actions-missing-secret --ci
```

## PR review checklist

Use this when an AI-assisted PR touches deployment config, CI, Docker, workers, or framework runtime config:

- [ ] Did the PR add a new `process.env.NAME`, `${NAME}`, `${{ secrets.NAME }}`, or CI `env` reference?
- [ ] Is every new required variable declared in `.env.example`, `.env.dist`, or the chosen template file?
- [ ] Are demo/docs outputs metadata-only, without raw secret values?
- [ ] Does the CI check run before deploy?
- [ ] Does the finding tell the contributor which template entry to add?

## Related fixtures

- `examples/demos/github-actions-missing-secret/`
- `examples/demos/docker-compose-missing-redis-url/`
- `docs/articles/ci-cd-env-validation-checklist.md`
