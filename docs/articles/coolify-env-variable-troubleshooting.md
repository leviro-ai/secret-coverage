# Coolify environment variable troubleshooting before deploy

Coolify makes it practical to self-host apps, databases, workers, and Docker Compose deployments. Deployments can still fail when the repository contract drifts away from the environment variables Coolify expects for a service.

That is deployment drift. The value may exist in a Coolify resource, project environment, compose stack, or server-level configuration, but the repo no longer documents the variable name needed before deploy.

## Symptom

A Coolify deployment works for one service or server, then fails for a preview, cloned project, worker, compose service, or fresh server with errors like:

- `DATABASE_URL is not set`
- `REDIS_URL is required`
- `Missing required environment variable: APP_KEY`
- Docker Compose prints `The API_TOKEN variable is not set. Defaulting to a blank string.`
- an app references `STRIPE_SECRET_KEY`, `S3_BUCKET`, `SMTP_PASSWORD`, `NEXT_PUBLIC_APP_URL`, or `SUPABASE_SERVICE_ROLE_KEY`, but `.env.example` / `.env.dist` does not mention it
- an AI-generated PR updates a Coolify deploy path, Docker Compose file, or app config but skips the env template

The usual sequence is:

1. A PR adds a new env var to app code, `docker-compose.yml`, a Dockerfile, or a deploy script.
2. Someone adds the real value in one Coolify app/resource.
3. The repository env template is not updated.
4. A second service, preview, clone, worker, or server discovers the missing contract late.

## Quick local check

Run Secret Coverage against the env template that represents your repository contract:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path . --env-template .env.example
```

If your team uses `.env.dist`:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path . --env-template .env.dist
```

To fail CI before a Coolify deploy starts:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path . --env-template .env.example --ci
```

Secret Coverage checks variable names, file paths, references, and template coverage as metadata-only deployment readiness signals. It does not need Coolify credentials, server SSH access, application values, database passwords, or secret values.

## What to look for

Treat these as Coolify deployment-readiness risks:

- `docker-compose.yml` references `${DATABASE_URL}`, `${REDIS_URL}`, `${APP_KEY}`, `${POSTGRES_PASSWORD}`, or `${S3_SECRET_ACCESS_KEY}`, but the repo env template does not list them;
- app code references `process.env.STRIPE_SECRET_KEY`, `process.env.SMTP_PASSWORD`, or `process.env.NEXT_PUBLIC_APP_URL`, but `.env.example` / `.env.dist` is stale;
- a worker service and web service share code but use different undocumented variables;
- Coolify resource variables exist only in one project/environment and are not captured in the repo contract;
- AI-generated deployment changes add a new compose service, health check, build arg, or app env requirement without updating the env template.

A common Coolify-style compose example:

```yaml
services:
  web:
    build: .
    environment:
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
      APP_KEY: ${APP_KEY}
      NEXT_PUBLIC_APP_URL: ${NEXT_PUBLIC_APP_URL}
  worker:
    build: .
    command: pnpm worker
    environment:
      DATABASE_URL: ${DATABASE_URL}
      QUEUE_SECRET: ${QUEUE_SECRET}
```

But the repository template only says:

```dotenv
NEXT_PUBLIC_APP_URL=https://example.com
DATABASE_URL=
```

That means the Coolify deploy path has undocumented requirements: `REDIS_URL`, `APP_KEY`, and `QUEUE_SECRET`.

## Minimal fix

Update the repository contract first:

```dotenv
NEXT_PUBLIC_APP_URL=https://example.com
DATABASE_URL=
REDIS_URL=
APP_KEY=
QUEUE_SECRET=
```

Then configure the actual values in the systems that own them: Coolify project variables, service environment variables, database resources, worker services, staging, production, and any CI job that deploys to Coolify.

For monorepos, scan the app or compose directory that owns the Coolify deployment:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path apps/web --env-template .env.example --ci
```

## Coolify review checklist

Before merging a Coolify-related deployment PR, ask:

1. Did the PR add any new `process.env.X`, `$X`, `${X}`, Docker Compose interpolation, Docker build arg, worker variable, or deploy-script variable?
2. Does `.env.example` or `.env.dist` document the required variable name without committing the real value?
3. Are secret values stored in Coolify or the appropriate secret owner rather than copied into repo files?
4. Will previews, cloned resources, worker services, staging, and production share the same documented env contract where they should?
5. Are Coolify-specific resource names, database connection ownership, and server assumptions documented separately from the variable-name contract?

Secret Coverage helps with the env-contract drift part. It does not validate Coolify resource existence, server connectivity, Docker image builds, database migrations, secret correctness, app health checks, or whether the deployed value is correct.

## Notes and limits

- Secret Coverage does not call the Coolify API.
- It does not read Coolify project settings, server configuration, resource environment values, SSH keys, deployment logs, or secret values.
- It does not replace Coolify resource management, server hardening, backup checks, Docker health checks, or production smoke tests.
- It checks whether environment variables referenced by your repo are documented in the repo's env contract.

For broader review guidance, see the [CI/CD environment variable validation checklist](ci-cd-env-validation-checklist.md) and the [articles and demo index](README.md).
