# Next.js checkout deploy fails because a server secret was never documented

A Next.js PR can look safe in review: an API route is added, local development works, and the deployment config does not obviously change. The failure appears later when production starts the route and `process.env.STRIPE_SECRET_KEY` is missing from the deployment environment.

Secret Coverage catches that deployment drift as metadata before the first signal is a broken checkout route.

## The drift pattern

This repository includes a small fixture at:

```txt
examples/demos/nextjs-missing-stripe-secret/
├── .env.example
├── next.config.js
└── src/app/api/checkout/route.ts
```

The route reads a server-only environment variable:

```ts
export async function POST() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    return Response.json({ error: 'Stripe is not configured' }, { status: 500 });
  }

  return Response.json({ ok: true });
}
```

But the env template documents only the public app URL:

```dotenv
NEXT_PUBLIC_APP_URL=https://example.com
```

That means the deployed app depends on `STRIPE_SECRET_KEY`, but the repo-visible environment contract never names it.

## Reproduce the check

From the Secret Coverage repo root:

```bash
pnpm scan -- --path examples/demos/nextjs-missing-stripe-secret --ci
```

Expected result: the command exits non-zero because `src/app/api/checkout/route.ts` references `STRIPE_SECRET_KEY` and the env template does not document it.

## What the report tells you

The important finding is metadata-only:

```md
- **STRIPE_SECRET_KEY** — STRIPE_SECRET_KEY is used in src/app/api/checkout/route.ts but missing from an env template.
  - Context: `src/app/api/checkout/route.ts` · `missing-from-template`
  - Fix: Add STRIPE_SECRET_KEY= to an env template and configure the value in your deployment environment.
```

Secret Coverage reports the variable name, file path, finding type, and recommended fix. It does not need to print or collect the Stripe secret value.

## Safe fix pattern

1. Add the missing variable name to the env template:

   ```dotenv
   NEXT_PUBLIC_APP_URL=https://example.com
   STRIPE_SECRET_KEY=
   ```

2. Configure the real value in Vercel, GitHub Actions, your container platform, or whichever deployment environment runs the Next.js app.
3. Re-run the metadata check before merging the checkout route:

   ```bash
   pnpm scan -- --ci
   ```

4. Keep server-only secrets out of `NEXT_PUBLIC_*` variables and out of committed local env files.

## PR review questions

For Next.js app changes, reviewers can ask:

- Did this PR add a new `process.env.SOME_KEY` reference in an API route, server component, config file, or background job?
- Is the variable documented in `.env.example` or `.env.dist`?
- Is the real value configured in the deployment environment that runs the route?
- Is the variable intentionally server-only, rather than exposed through a `NEXT_PUBLIC_*` name?
- Does CI fail before deploy when the environment contract is incomplete?

## Why this helps AI-agent workflows

AI-generated PRs often add the route and handler logic faster than they update operational docs. A deterministic metadata check turns that hidden deployment assumption into a small review diff: document the variable name, configure the real value outside git, and merge without waiting for checkout to fail in production.

Related assets:

- [CI/CD environment variable validation checklist](ci-cd-env-validation-checklist.md)
- [AI-agent PR environment review walkthrough](ai-agent-pr-env-review-walkthrough.md)
- [GitHub Actions missing-secrets troubleshooting](github-actions-missing-secrets-troubleshooting.md)
