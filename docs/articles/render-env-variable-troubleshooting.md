# Render environment variable troubleshooting before deploy

Render deploys can fail even when the build succeeds: the service starts, then crashes because a required environment variable was never documented in the repository.

That is deployment drift. The app contract changed, but `.env.example` or `.env.dist` did not.

## Symptom

A Render web service, background worker, cron job, or preview environment fails with errors like:

- `DATABASE_URL is required`
- `Missing STRIPE_SECRET_KEY`
- `REDIS_URL must be set`
- the build passes but the service exits during boot
- a worker works in production but fails in a preview or staging service

The usual pattern is simple:

1. A PR adds code or config that references a new environment variable.
2. Someone adds the value manually in one Render environment.
3. The repository template is not updated.
4. The next service, preview, teammate setup, or incident review does not know the variable is required.

## Quick local check

Run Secret Coverage against the repo contract before opening or merging the PR:

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

Secret Coverage checks variable names, files, references, and template coverage as metadata-only deployment readiness signals. It does not need Render credentials and does not print raw secret values.

## What to look for

Treat these as Render deployment-readiness risks:

- code references `process.env.X` but the repo template has no `X=` entry;
- Docker, CI, or deploy scripts reference `$X` / `${X}` without documenting `X`;
- background workers require variables that the web service template does not mention;
- preview services drift from production because only one Render environment was manually updated;
- AI-generated PRs add config assumptions without updating `.env.example`.

A common example:

```ts
// src/jobs/billing-worker.ts
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is required");
}
```

But the repository template only includes:

```dotenv
DATABASE_URL=
NEXT_PUBLIC_APP_URL=
```

That means the Render service has an undocumented deployment requirement.

## Minimal fix

Update the repository contract first:

```dotenv
DATABASE_URL=
NEXT_PUBLIC_APP_URL=
STRIPE_SECRET_KEY=
```

Then configure the actual value in each Render environment that runs the affected code path: production service, preview service, worker, cron job, or migration job.

For monorepos, scan the deployed app directory if each app owns its own env contract:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path apps/web --env-template .env.example --ci
```

## Where this fits in a Render workflow

Use the check in three places:

1. **Before PR review** — catch new env assumptions introduced by feature work or AI-generated changes.
2. **In CI before Render deploys** — fail fast on missing template coverage before the service starts with incomplete config.
3. **During incident review** — compare the crashed service's required variables with the repo contract.

This does not replace Render's dashboard, environment groups, or secret storage. It gives the repository a local-first deployment-readiness check so future environments know what the app expects.

## Notes and limits

- Secret Coverage does not pull variables from Render.
- It does not validate whether a configured value is correct.
- It does not replace a secrets manager or runtime env loader.
- It helps catch repository/deployment drift before a Render deploy or boot path fails.

For concrete runnable examples, see the demo fixtures in [`examples/demos/`](../../examples/demos/), especially GitHub Actions, Docker Compose, Vercel, CircleCI, GitLab CI, and Next.js drift cases.
