# Staging vs production env drift checklist

Staging is supposed to reduce production surprises. It often becomes a second source of environment-variable drift instead: production has a value, staging has a stale value, preview has no value, and the repository template does not say which variables are required by each runtime.

This checklist helps reviewers compare staging and production without exposing raw secret values.

## The failure pattern

A deployment can look healthy in code review and still fail because environments disagree about the variable contract:

- staging deploys with `DATABASE_URL`, but production also needs `STRIPE_SECRET_KEY`;
- a worker in production uses `REDIS_URL`, but the staging worker was never configured;
- a migration command references `MIGRATION_DATABASE_URL`, but only the web service env was reviewed;
- an AI-generated PR adds a webhook handler and `WEBHOOK_SECRET`, but only production gets updated manually;
- `.env.example` documents old onboarding variables, not the variables deployment jobs now require.

The unsafe shortcut is to compare secret values in chat, tickets, screenshots, or logs. The safer review is to compare variable names and ownership.

## 1. Make the repo contract explicit

Start with the env template that contributors can inspect safely:

```dotenv
APP_ENV=
DATABASE_URL=
STRIPE_SECRET_KEY=
REDIS_URL=
WEBHOOK_SECRET=
```

The template should not contain real staging or production values. It should answer: “which variable names does this deployable unit require?”

If staging or production references a variable that is not in `.env.example`, `.env.dist`, or the chosen template file, the contract is incomplete even when the platform has a real value configured.

## 2. Compare by runtime, not by environment page

Most teams check one deployment settings page and stop. Drift usually hides across runtimes:

| Runtime | Examples to review | Common drift |
| --- | --- | --- |
| Web/API | server routes, framework config, platform build settings | new server secret added to production only |
| Worker/queue | Docker Compose, process manager, background job config | worker needs `REDIS_URL`, web env does not |
| Migration/release job | CI workflow, release command, one-off script | migration secret missing from staging |
| Webhook/cron | scheduled job config, webhook handler, platform cron | handler reads `WEBHOOK_SECRET` not in template |

Write the variable names down once in the repo contract, then configure values in the platform that owns each environment.

## 3. Review staging-only and production-only variables deliberately

Some differences are intentional. For example:

```dotenv
# Required in both staging and production
DATABASE_URL=
STRIPE_SECRET_KEY=
WEBHOOK_SECRET=

# Staging-only or production-only behavior should be named clearly
STAGING_SANDBOX_API_URL=
PRODUCTION_BILLING_PLAN_ID=
```

A variable being environment-specific is not a problem. A variable being undocumented is the problem.

When a variable exists only in production, add a short note in your internal runbook or PR checklist explaining why staging does not need it. Do not rely on memory.

## 4. Run a metadata-only check before deploy

Secret Coverage compares variable names referenced by repo/deployment config with the env template. It does not need raw secret values.

For a consumer repo:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path . --ci
```

If you are validating one app inside a monorepo, start narrow:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path apps/web --ci
```

If your repo uses `.env.dist` or another explicit template name:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path apps/web --env-template .env.dist --ci
```

For local development inside this repository, keep the pnpm argument separator:

```bash
pnpm scan -- --path examples/demos/github-actions-missing-secret --ci
```

## 5. Add the check where drift is introduced

A useful CI check runs before the deploy job, not after production has already failed:

```yaml
name: env-contract

on:
  pull_request:
  push:
    branches: [main]

jobs:
  secret-coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: pnpm dlx @leviro-ai/secret-coverage scan --path . --ci
```

This check is not a replacement for platform secret management. It is a guardrail that asks whether the repository contract still matches the deployment assumptions in code and config.

## Quick review checklist

Before changing staging or production configuration, ask:

- [ ] Did any workflow, platform config, Docker file, worker, cron, migration, webhook, or server route start referencing a new env var?
- [ ] Is every required variable name documented in `.env.example`, `.env.dist`, or the chosen template file?
- [ ] Are staging-only and production-only variables intentionally different and named clearly?
- [ ] Did the review compare variable names, not raw secret values?
- [ ] Are worker, migration, cron, and webhook runtimes included, not only the web service?
- [ ] Does CI fail before deployment when a required variable is missing from the template?

Staging and production do not need identical values. They do need an explicit, reviewable environment contract.

## Related docs

- [CI/CD environment variable validation checklist](ci-cd-env-validation-checklist.md)
- [Preview environment variable checklist](preview-environment-variable-checklist.md)
- [Monorepo env validation with `--path`](monorepo-env-validation-with-path.md)
- [Env template vs secret manager](env-template-vs-secret-manager.md)
