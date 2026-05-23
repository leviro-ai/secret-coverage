# Railway environment variable troubleshooting before deploy

Railway deploys can fail for a boring reason: the service expects an environment variable that the repository never documented.

This is not a secret-value problem. It is a deployment contract problem.

## Symptom

A Railway service, worker, or migration job works in one environment but fails in another with errors like:

- `DATABASE_URL is required`
- `Missing REDIS_URL`
- `Cannot initialize Stripe client without STRIPE_SECRET_KEY`
- a worker exits immediately after boot
- a migration job fails only in Railway, not locally

The usual drift pattern is:

1. Code or config starts referencing a new variable.
2. The variable gets added manually in one Railway service.
3. `.env.example` or `.env.dist` is not updated.
4. The next preview, worker, migration, or teammate setup misses the requirement.

## Quick manual check

Before blaming Railway, compare the repository contract with the variables the app actually references.

```bash
# From your project root
pnpm dlx @leviro-ai/secret-coverage scan --path . --env-template .env.example
```

If your project uses `.env.dist` as the contract:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path . --env-template .env.dist
```

For CI usage, fail when a critical drift finding appears:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path . --env-template .env.example --ci
```

Secret Coverage checks variable names and metadata. It does not need Railway credentials and does not print raw secret values.

## What to look for

Treat these as deployment-drift signals:

- `missing-from-template`: code, Docker, CI, or config references a variable that is absent from the env template;
- stale env-template entries that no longer appear in app/config references;
- variables required by background workers but not documented for the web service;
- migration-only variables that are present in Railway but not described in the repo;
- AI-generated config changes that add a new env assumption without updating `.env.example`.

A common example:

```ts
// src/billing/stripe.ts
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is required");
}
```

But the template only says:

```dotenv
DATABASE_URL=
NEXT_PUBLIC_APP_URL=
```

That means every future Railway environment now has an undocumented deployment requirement.

## Minimal fix

Update the repository template, not just the Railway dashboard:

```dotenv
DATABASE_URL=
NEXT_PUBLIC_APP_URL=
STRIPE_SECRET_KEY=
```

Then make sure each Railway environment that needs the app path has the corresponding value configured in Railway.

For monorepos, scan the deployed app directory rather than the whole workspace if each app has its own env contract:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path apps/web --env-template .env.example --ci
```

## Where this fits in a Railway workflow

Use the scan in one of three places:

1. **Before opening a PR** — quick local check for AI-generated or refactor changes.
2. **In CI before deployment** — fail fast before Railway sees a broken config assumption.
3. **During incident review** — compare the failed service's required variables with the repo template.

This does not replace Railway's variable management. It adds a local-first deployment-readiness check so the repo describes what the deployment expects.

## Notes and limits

- Secret Coverage does not pull variables from Railway.
- It does not validate whether the value is correct.
- It does not replace a secrets manager or runtime env loader.
- It helps catch repository/deployment drift before the deploy path fails.

For concrete runnable examples, see the existing demo fixtures in [`examples/demos/`](../../examples/demos/), especially GitHub Actions, Docker Compose, Vercel, CircleCI, GitLab CI, and Next.js drift cases.
