# Vercel serverless function says an API key env var is not set

A Vercel serverless function, route handler, or API route can fail with an error like:

```txt
ANTHROPIC_API_KEY environment variable not set
OPENAI_API_KEY environment variable not set
STRIPE_SECRET_KEY environment variable not set
```

That error does not always mean the secret value was never added. Start by separating three different checks:

1. **Name:** does the deployed code read exactly the same variable name that was configured?
2. **Scope:** is the value available to the Vercel environment that is actually running: Preview, Production, or Development?
3. **Contract:** is the required variable documented in the repo so reviewers can see the deployment assumption before the route ships?

Secret Coverage helps with the third check. It does not read your Vercel dashboard, inspect secret values, or prove that Production has the right value.

## Minimal failing pattern

A server-side route might contain a hard runtime requirement:

```ts
const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  throw new Error('ANTHROPIC_API_KEY environment variable not set');
}
```

The repo-side environment contract should document the variable name without exposing the value:

```dotenv
ANTHROPIC_API_KEY=
```

If the route is merged without that contract update, reviewers may never notice that the deployment now depends on a new variable.

## Check the variable name first

Environment variable names are exact. These are different names:

```txt
ANTHROPIC_API_KEY
anthropic_api_key
ANTHROPIC_KEY
```

When debugging a Vercel runtime error, compare:

- the exact `process.env.X` name used by the serverless function or route handler;
- the name configured in Vercel;
- the placeholder name in `.env.example`, `.env.dist`, or your chosen env template;
- any deploy/build command that passes variables through another layer.

Do not paste raw secret values into tickets, comments, screenshots, or repo docs. Only compare names.

## Check Preview vs Production scope

A common Vercel failure mode is configuring the value for one environment while the failing deployment runs in another.

Check whether the value exists for the deployment that is failing:

- Production deploy;
- Preview deploy for a pull request;
- Development/local workflow;
- a monorepo app deployed from a subdirectory;
- a serverless function or route handler that runs after build;
- a build step that needs the variable earlier than runtime.

Also redeploy after adding or changing a value. A deployment that was built before the variable existed may keep failing until a new deployment picks up the updated configuration.

## Check the repo contract

Vercel stores the real value. Your repo should store only the contract: the variable names that code and deployment config expect to exist.

For example:

```dotenv
# .env.example
ANTHROPIC_API_KEY=
NEXT_PUBLIC_APP_URL=
```

Then run a metadata-only check before merge:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --ci
```

Secret Coverage scans supported repo/config surfaces and compares referenced environment variable names with the declared template. It is useful for catching this class of drift:

> Code starts requiring `ANTHROPIC_API_KEY`, but `.env.example` / `.env.dist` never documented it.

It is not a Vercel API integration. It does not verify whether Vercel contains the correct value, whether the value is valid, or whether the secret has the right permissions.

## PR review checklist

Before merging a serverless/API route that reads a new env var, check:

- [ ] Does the code use the exact variable name expected in Vercel?
- [ ] Is casing consistent everywhere?
- [ ] Is the variable documented in `.env.example`, `.env.dist`, or the selected template file?
- [ ] Is the value configured for the environment that will run this deployment: Preview or Production?
- [ ] Was the deployment redeployed after adding the variable?
- [ ] In monorepos, is the Vercel project pointing at the app that owns the env contract?
- [ ] Do serverless routes, workers, build steps, and background jobs use the same name where they should?
- [ ] Did the review avoid exposing raw secret values?

## What Secret Coverage can and cannot catch

Secret Coverage can help when a repo-visible file references a variable name that is missing from the declared env template.

It can catch repo-contract drift such as:

```txt
ANTHROPIC_API_KEY is used by source/config but missing from .env.example.
```

It cannot catch Vercel account-state problems such as:

- the value exists in Preview but not Production;
- the value is misspelled in the Vercel dashboard;
- the value is expired or unauthorized;
- the deployment has not been redeployed after the value changed;
- the secret value itself is wrong.

Use it as a pre-merge contract check, then verify Vercel environment scope and redeploy behavior separately.

## Related guides

- [Vercel environment variable troubleshooting](vercel-env-variable-troubleshooting.md)
- [Preview environment variable checklist](preview-environment-variable-checklist.md)
- [Pull request env var review checklist](pr-env-var-review-checklist.md)
- [Next.js checkout deploy fails because a server secret was never documented](nextjs-missing-stripe-secret.md)
