# Heroku environment variable troubleshooting before deploy

Heroku releases can fail during dyno boot, release phase commands, worker startup, or review-app setup because a required config var was never documented in the repository.

That is deployment drift. The app, `Procfile`, CI deploy workflow, or runtime code changed, but `.env.example` or `.env.dist` did not.

## Symptom

A Heroku app, review app, worker dyno, scheduler job, or release phase fails with errors like:

- `DATABASE_URL is required`
- `STRIPE_SECRET_KEY must be set`
- `REDIS_URL is missing`
- a review app boots differently from production
- a release phase succeeds locally but fails on Heroku
- a dyno crashes when code reads `process.env.X`

The common pattern is simple:

1. A PR adds source code, a `Procfile`, an app manifest, or deploy workflow that references a new environment variable.
2. The value is configured manually in one Heroku app or pipeline stage.
3. The repository template is not updated.
4. The next review app, teammate setup, pipeline promotion, or incident review does not know the variable is required.

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

Secret Coverage checks variable names, files, references, and template coverage as metadata-only deployment-readiness signals. It does not need Heroku credentials and does not print raw secret values.

## What to look for

Treat these as Heroku deployment-readiness risks:

- source code references `process.env.X` but the repo template has no `X=` entry;
- `Procfile` commands, release phase scripts, or worker dynos require variables that only exist in one Heroku app;
- CI deploy workflows reference `$X` / `${X}` or platform secrets without documenting the repo contract;
- review apps differ from staging or production because only one app received a manual config-var update;
- AI-generated PRs add runtime config assumptions without updating `.env.example`.

A common example:

```js
// src/billing/webhooks.js
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

That means the Heroku dyno has an undocumented deployment requirement.

## Minimal fix

Update the repository contract first:

```dotenv
DATABASE_URL=
REDIS_URL=
STRIPE_SECRET_KEY=
```

Then configure the actual value in every Heroku app or pipeline stage that runs the affected code path: review apps, staging, production, worker dynos, release phase commands, scheduled jobs, and local development.

For monorepos, scan the deployed app directory if each app owns its own env contract:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path apps/api --env-template .env.example --ci
```

## Where this fits in a Heroku workflow

Use the check in three places:

1. **Before PR review** — catch new env assumptions introduced by feature work or AI-generated changes.
2. **In CI before deploy or pipeline promotion** — fail fast on missing template coverage before a dyno or release phase discovers the gap.
3. **During incident review** — compare the failed process path's required variables with the repo contract.

This does not replace Heroku config vars, pipeline promotion controls, or a secrets manager. It gives the repository a local-first deployment-readiness check so future environments know what the app expects.

## Notes and limits

- Secret Coverage does not pull config vars from Heroku.
- It does not validate whether a configured value is correct.
- It does not replace a secrets manager or runtime env loader.
- It helps catch repository/deployment drift before a Heroku dyno, review app, worker, or release phase fails.

For concrete runnable examples, see the demo fixtures in [`examples/demos/`](../../examples/demos/), especially GitHub Actions, Docker Compose, Vercel, CircleCI, GitLab CI, and Next.js drift cases.
