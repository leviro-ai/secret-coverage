# Fly.io environment variable troubleshooting before deploy

Fly.io is great for shipping small apps, workers, and globally distributed services quickly. Deployments can still fail when the repository contract drifts away from the environment variables a Fly app, machine, release command, or Docker build expects.

That is deployment drift. The value may exist in Fly secrets, a local developer shell, or one production app, but the repo no longer documents the variable name required before deploy.

## Symptom

A Fly.io deploy, release command, machine restart, worker, or fresh app clone fails with errors like:

- `DATABASE_URL is not set`
- `REDIS_URL is required`
- `Missing required environment variable: APP_SECRET`
- `Error: STRIPE_SECRET_KEY must be configured`
- `fly deploy` succeeds, but the app crashes on boot because `NEXT_PUBLIC_APP_URL`, `SENTRY_DSN`, `SUPABASE_URL`, or `SUPABASE_SERVICE_ROLE_KEY` is missing
- an AI-generated PR changes `fly.toml`, Docker build args, release commands, or app code but skips `.env.example` / `.env.dist`

The usual sequence is:

1. A PR adds a new env var to app code, `fly.toml`, Dockerfile, release command, or worker process.
2. Someone sets the real value with `fly secrets set` for one app.
3. The repository env template is not updated.
4. A preview app, staging app, worker, fresh region/machine, or teammate discovers the missing contract late.

## Quick local check

Run Secret Coverage against the env template that represents your repository contract:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path . --env-template .env.example
```

If your team uses `.env.dist`:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path . --env-template .env.dist
```

To fail CI before a Fly deploy starts:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path . --env-template .env.example --ci
```

Secret Coverage checks variable names, file paths, references, and template coverage as metadata-only deployment readiness signals. It does not need Fly.io credentials, Fly API tokens, app secret values, database passwords, or access to deployed machines.

## What to look for

Treat these as Fly.io deployment-readiness risks:

- app code references `process.env.DATABASE_URL`, `process.env.REDIS_URL`, `process.env.STRIPE_SECRET_KEY`, or `process.env.APP_SECRET`, but `.env.example` / `.env.dist` is stale;
- `fly.toml` release commands, process groups, build args, or deploy scripts assume variables that are not documented in the repo contract;
- Dockerfile or Docker Compose files interpolate `$VAR` / `${VAR}` values used by a Fly deployment;
- a worker process and web process share code but have different undocumented variable requirements;
- staging and production Fly apps have secrets set manually, but no checked-in template tells reviewers what names must exist;
- AI-generated deploy changes add a new region, service, queue, cron, release command, or build arg without updating the env template.

A common Fly.io-style drift example:

```toml
# fly.toml
app = "example-api"
primary_region = "ams"

[deploy]
  release_command = "pnpm migrate"

[env]
  NODE_ENV = "production"
  NEXT_PUBLIC_APP_URL = "https://example.com"

[processes]
  app = "pnpm start"
  worker = "pnpm worker"
```

And the app code expects:

```ts
const databaseUrl = process.env.DATABASE_URL;
const redisUrl = process.env.REDIS_URL;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const appSecret = process.env.APP_SECRET;
```

But the repository template only says:

```dotenv
NEXT_PUBLIC_APP_URL=https://example.com
DATABASE_URL=
```

That means the Fly deploy path has undocumented requirements: `REDIS_URL`, `STRIPE_SECRET_KEY`, and `APP_SECRET`.

## Minimal fix

Update the repository contract first:

```dotenv
NEXT_PUBLIC_APP_URL=https://example.com
DATABASE_URL=
REDIS_URL=
STRIPE_SECRET_KEY=
APP_SECRET=
```

Then configure actual values in the systems that own them: Fly secrets, staging and production Fly apps, managed Postgres/Redis providers, CI jobs that run `fly deploy`, and any release-command environment.

For monorepos, scan the app directory that owns the Fly deployment:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path apps/api --env-template .env.example --ci
```

## Fly.io review checklist

Before merging a Fly-related deployment PR, ask:

1. Did the PR add any new `process.env.X`, `$X`, `${X}`, Docker build arg, release-command variable, worker variable, or deploy-script variable?
2. Does `.env.example` or `.env.dist` document the required variable name without committing the real value?
3. Are secret values stored in Fly secrets or the appropriate secret owner rather than copied into repo files?
4. Will staging, production, preview apps, workers, release commands, and fresh machines share the same documented env contract where they should?
5. Are Fly-specific app names, regions, volumes, machines, scale settings, and database attachments documented separately from the variable-name contract?

Secret Coverage helps with the env-contract drift part. It does not validate Fly app existence, regions, machine health, volumes, database attachment state, release-command success, secret correctness, or whether the deployed value is correct.

## Notes and limits

- Secret Coverage does not call the Fly.io API.
- It does not read Fly app settings, Fly secrets, organization data, machine state, deployment logs, volumes, or secret values.
- It does not replace `fly deploy`, Fly health checks, release-command verification, database migrations, smoke tests, or incident monitoring.
- It checks whether environment variables referenced by your repo are documented in the repo's env contract.

For broader review guidance, see the [CI/CD environment variable validation checklist](ci-cd-env-validation-checklist.md) and the [articles and demo index](README.md).
