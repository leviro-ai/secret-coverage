# Netlify environment variable troubleshooting before deploy

Netlify deploys can pass the build step and still fail during serverless function execution, scheduled functions, edge functions, or framework runtime boot because a required environment variable was never documented in the repository.

That is deployment drift. The app or deploy config changed, but `.env.example` or `.env.dist` did not.

## Symptom

A Netlify site, deploy preview, function, or background task fails with errors like:

- `Missing STRIPE_SECRET_KEY`
- `DATABASE_URL is required`
- `SUPABASE_SERVICE_ROLE_KEY must be set`
- a deploy preview works differently from production
- a function succeeds locally but fails after deploy
- the build passes, then a runtime path crashes when it reads `process.env.X`

The usual pattern is simple:

1. A PR adds source code, a function, or build config that references a new environment variable.
2. The value is configured manually in one Netlify environment.
3. The repository template is not updated.
4. The next deploy preview, teammate setup, incident review, or migration job does not know the variable is required.

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

Secret Coverage checks variable names, files, references, and template coverage as metadata-only deployment-readiness signals. It does not need Netlify credentials and does not print raw secret values.

## What to look for

Treat these as Netlify deployment-readiness risks:

- source code references `process.env.X` but the repo template has no `X=` entry;
- serverless functions, scheduled functions, or edge functions require variables that are only configured in one Netlify context;
- build scripts reference `$X` / `${X}` without documenting `X`;
- deploy previews drift from production because only production received a manual environment-variable update;
- AI-generated PRs add config assumptions without updating `.env.example`.

A common example:

```ts
// netlify/functions/create-checkout-session.ts
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is required");
}
```

But the repository template only includes:

```dotenv
NEXT_PUBLIC_APP_URL=https://example.com
DATABASE_URL=
```

That means the Netlify function has an undocumented deployment requirement.

## Minimal fix

Update the repository contract first:

```dotenv
NEXT_PUBLIC_APP_URL=https://example.com
DATABASE_URL=
STRIPE_SECRET_KEY=
```

Then configure the actual value in each Netlify context that runs the affected code path: production, deploy previews, branch deploys, local development, scheduled functions, or background jobs.

For monorepos, scan the deployed app directory if each app owns its own env contract:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path apps/web --env-template .env.example --ci
```

## Where this fits in a Netlify workflow

Use the check in three places:

1. **Before PR review** — catch new env assumptions introduced by feature work or AI-generated changes.
2. **In CI before Netlify deploys** — fail fast on missing template coverage before build or runtime config drifts.
3. **During incident review** — compare the failed function or site path's required variables with the repo contract.

This does not replace Netlify's environment-variable UI, deploy contexts, or secret storage. It gives the repository a local-first deployment-readiness check so future contexts know what the app expects.

## Notes and limits

- Secret Coverage does not pull variables from Netlify.
- It does not validate whether a configured value is correct.
- It does not replace a secrets manager or runtime env loader.
- It helps catch repository/deployment drift before a Netlify deploy preview, function, or runtime path fails.

For concrete runnable examples, see the demo fixtures in [`examples/demos/`](../../examples/demos/), especially GitHub Actions, Docker Compose, Vercel, CircleCI, GitLab CI, and Next.js drift cases.
