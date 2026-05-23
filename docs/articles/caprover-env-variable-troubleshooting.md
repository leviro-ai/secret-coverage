# CapRover environment variable troubleshooting before deploy

CapRover is convenient for small teams because a `captain-definition` file can describe how an app should build and run without a large platform team. Deploys can still fail when the variables referenced by that deployment contract drift away from `.env.example`, `.env.dist`, CI secrets, or the CapRover app settings.

That is deployment drift. The real value may exist in the CapRover dashboard, on one server, in a CI secret, or on one developer's machine, but the repository no longer documents the variable name required for a safe deploy.

## Symptom

A CapRover deploy, image build, app restart, or post-deploy smoke test fails with errors like:

- `DATABASE_URL is not set`
- `REDIS_URL must be configured`
- `NEXT_PUBLIC_API_URL is undefined`
- `STRIPE_SECRET_KEY is required`
- `CAPROVER_APP_TOKEN is missing from CI`
- a Node/Next/Rails/Laravel app starts locally but crashes after CapRover deploy because a runtime env var only existed in `.env.local`
- an AI-generated PR changes `captain-definition`, Dockerfile, Compose-style config, or deploy scripts but does not update `.env.example` / `.env.dist`

The usual sequence is:

1. A PR adds a new runtime variable to application code, `captain-definition`, Dockerfile build args, or the CI deploy command.
2. Someone sets the real value in the CapRover dashboard or CI provider.
3. The repository env template is not updated.
4. A new server, staging app, teammate clone, CI deploy, or production restart discovers the missing contract late.

## Quick local check

Run Secret Coverage against the env template that represents your repository contract:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path . --env-template .env.example
```

If your team uses `.env.dist`:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path . --env-template .env.dist
```

To fail CI before a CapRover deploy starts:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path . --env-template .env.example --ci
```

Secret Coverage checks variable names, file paths, references, and template coverage as metadata-only deployment readiness signals. It does not need CapRover credentials, server access, dashboard access, app settings, deploy tokens, or secret values.

## What to look for

Treat these as CapRover deployment-readiness risks:

- `captain-definition` references `$VAR` / `${VAR}` values that are not documented in `.env.example` or `.env.dist`;
- application code references `process.env.DATABASE_URL`, `process.env.REDIS_URL`, `process.env.STRIPE_SECRET_KEY`, `process.env.SENDGRID_API_KEY`, or framework public variables without updating the env template;
- Dockerfile `ARG` / `ENV` values depend on CI or CapRover-provided variables that are not visible in the repo contract;
- CI deploy scripts reference `CAPROVER_URL`, `CAPROVER_APP`, `CAPROVER_APP_TOKEN`, or image registry variables that are not documented for maintainers;
- staging and production CapRover apps have manually configured env vars with no checked-in template that tells reviewers what names must exist;
- AI-generated deployment changes add a service, build command, health check, or worker process but skip the env contract.

A common CapRover-style drift example:

```json
{
  "schemaVersion": 2,
  "dockerfilePath": "./Dockerfile"
}
```

The Dockerfile or app then expects:

```dockerfile
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
```

```ts
const databaseUrl = process.env.DATABASE_URL;
const redisUrl = process.env.REDIS_URL;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
```

But the repository template only says:

```dotenv
NEXT_PUBLIC_API_URL=https://api.example.test
DATABASE_URL=
```

That means the CapRover deploy path has undocumented requirements: `REDIS_URL` and `STRIPE_SECRET_KEY`. If CI also deploys through CapRover, the deploy credentials such as `CAPROVER_URL`, `CAPROVER_APP`, and `CAPROVER_APP_TOKEN` should be documented as names in the appropriate CI/env contract without committing their values.

## Minimal fix

Update the repository contract first:

```dotenv
NEXT_PUBLIC_API_URL=https://api.example.test
DATABASE_URL=
REDIS_URL=
STRIPE_SECRET_KEY=
CAPROVER_URL=
CAPROVER_APP=
CAPROVER_APP_TOKEN=
```

Then configure actual values in the systems that own them: CapRover app environment variables, CI secrets, image registry secrets, staging/production app settings, and local development env files.

For monorepos, scan the app directory that owns the CapRover deployment:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path apps/web --env-template .env.example --ci
```

## CapRover review checklist

Before merging a CapRover-related deployment PR, ask:

1. Did the PR add any new `process.env.X`, `$X`, `${X}`, Dockerfile `ARG` / `ENV`, `captain-definition`, app config, or CI deploy-token reference?
2. Does `.env.example` or `.env.dist` document the required variable name without committing the real value?
3. Are secret values stored in CapRover/CI/registry secret stores rather than copied into repo files?
4. Will staging, production, worker apps, one-off jobs, and local development share the same documented env contract where they should?
5. Are CapRover app names, domains, image names, registry credentials, health checks, and deploy tokens documented separately from the variable-name contract?

Secret Coverage helps with the env-contract drift part. It does not validate CapRover app existence, server health, dashboard settings, domain routing, image build success, registry permissions, deployed process health, or whether the deployed value is correct.

## Notes and limits

- Secret Coverage does not call CapRover APIs.
- It does not read CapRover dashboard settings, server configuration, app env values, deploy tokens, registry credentials, logs, or secret values.
- It does not replace CapRover deploys, app smoke tests, Docker image checks, server monitoring, secret rotation, or rollback plans.
- It checks whether environment variables referenced by your repo are documented in the repo's env contract.

For broader review guidance, see the [CI/CD environment variable validation checklist](ci-cd-env-validation-checklist.md) and the [articles and demo index](README.md).
