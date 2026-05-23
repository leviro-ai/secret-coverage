# DigitalOcean App Platform environment variable troubleshooting before deploy

DigitalOcean App Platform deploys can fail during build, app startup, worker startup, or job execution when a required environment variable is present in one environment but missing from the repository contract.

That is deployment drift. The app spec, CI deploy workflow, Dockerfile, or runtime code changed, but `.env.example` or `.env.dist` did not.

## Symptom

A DigitalOcean App Platform deployment, preview, worker, or job fails with errors like:

- `DATABASE_URL is required`
- `STRIPE_SECRET_KEY must be set`
- `REDIS_URL is missing`
- the build succeeds but runtime startup crashes
- a worker or job runs in production but not in a preview environment
- code reads `process.env.X` that is configured manually in the dashboard but not documented in the repo

The common pattern is simple:

1. A PR adds app code, build commands, Docker config, or CI deploy steps that reference a new variable.
2. The value is configured manually in a DigitalOcean app or component.
3. The repository template is not updated.
4. The next preview, teammate setup, redeploy, or incident review does not know the variable is required.

## Quick local check

Run Secret Coverage against the repository contract before opening or merging the PR:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path . --env-template .env.example
```

If your team uses `.env.dist`:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path . --env-template .env.dist
```

To fail CI when critical drift is found:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path . --env-template .env.example --ci
```

Secret Coverage checks variable names, files, references, and template coverage as metadata-only deployment-readiness signals. It does not need DigitalOcean credentials and does not print raw secret values.

## What to look for

Treat these as DigitalOcean App Platform deployment-readiness risks:

- source code references `process.env.X` but the repo template has no `X=` entry;
- Dockerfile, build commands, worker commands, or job scripts require variables that only exist in one DigitalOcean app;
- GitHub Actions, GitLab CI, or CircleCI deploy workflows reference `$X` / `${X}` without documenting the repo contract;
- preview environments differ from production because only one app or component received a manual variable update;
- AI-generated PRs add deployment assumptions without updating `.env.example`.

A common example:

```js
// src/checkout/webhook.js
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is required');
}
```

But the repository template only includes:

```dotenv
DATABASE_URL=
REDIS_URL=
```

That means the DigitalOcean app has an undocumented deployment requirement.

## Minimal fix

Update the repository contract first:

```dotenv
DATABASE_URL=
REDIS_URL=
STRIPE_SECRET_KEY=
```

Then configure the actual value in every DigitalOcean app/component environment that runs the affected code path: web service, worker, job, preview app, staging, production, and local development.

For monorepos, scan the deployed app directory if each service owns its own env contract:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path apps/api --env-template .env.example --ci
```

## Where this fits in a DigitalOcean workflow

Use the check in three places:

1. **Before PR review** — catch new env assumptions introduced by feature work or AI-generated changes.
2. **In CI before deploy** — fail fast on missing template coverage before App Platform discovers the gap during build or startup.
3. **During incident review** — compare the failed component's required variables with the repo contract.

This does not replace DigitalOcean App Platform environment settings, secret storage, or a secrets manager. It gives the repository a local-first deployment-readiness check so future environments know what the app expects.

## Notes and limits

- Secret Coverage does not pull variables from DigitalOcean.
- It does not validate whether a configured value is correct.
- It does not replace a secrets manager or runtime env loader.
- It helps catch repository/deployment drift before a DigitalOcean deploy, worker, job, or preview environment fails.

For concrete runnable examples, see the demo fixtures in [`examples/demos/`](../../examples/demos/), especially GitHub Actions, Docker Compose, Vercel, CircleCI, GitLab CI, and Next.js drift cases.
