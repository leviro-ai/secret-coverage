# Medium Draft — AI agents are making deployment drift easier to create

Status: draft, not published. Requires Darius approval before posting to Medium.
Target channel: Medium (`https://medium.com/@dardar.hermes`)
Recommended canonical title: `AI agents are making deployment drift easier to create`

## Publishing note

This is Medium-native narrative copy. It should not be posted verbatim to Dev.to, Reddit, Hacker News, or X/Twitter. If adapted elsewhere, rewrite for that platform.

## Draft

# AI agents are making deployment drift easier to create

AI coding tools are very good at changing the visible parts of an application.

They add a checkout route. They wire a webhook handler. They update a GitHub Actions workflow. They add a Redis cache. They introduce a new deployment step.

What they do not reliably update is every environment that now has to know about those changes.

That gap is where a lot of boring deployment failures live.

Not dramatic security incidents. Not complex infrastructure outages. Just this:

```txt
The code now expects STRIPE_SECRET_KEY.
The CI workflow references STRIPE_SECRET_KEY.
.env.example was never updated.
The deploy fails later.
```

The bug was not really in the code. The bug was in the assumption that every environment knew about the new variable.

## Env vars are hidden contracts

An environment variable is rarely just a string.

In a real project, it becomes a contract between several places:

- application code;
- `.env.example` or `.env.dist`;
- GitHub Actions, GitLab CI, CircleCI, or another pipeline;
- Docker Compose or deployment config;
- Vercel, Railway, Render, Fly.io, or another hosting platform;
- the person reviewing the PR.

When a human changes one side of that contract, they might remember to update the rest.

When an AI agent changes code and config quickly, that contract can drift faster than the team notices.

The result is a deployment that was syntactically valid but operationally incomplete.

## A small example

Imagine a workflow that deploys only when a Stripe secret exists:

```yaml
- name: Deploy
  env:
    STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
  run: pnpm deploy
```

If the repository template only says this:

```dotenv
NEXT_PUBLIC_APP_URL=
```

then a reviewer has to notice the missing deployment assumption manually.

That is easy once. It is harder across many AI-generated changes, multiple CI files, Docker Compose services, preview deployments, and environment-specific configs.

## The failure mode is not limited to CI

The same thing happens in Docker Compose:

```yaml
services:
  worker:
    environment:
      REDIS_URL: ${REDIS_URL}
```

If `REDIS_URL` is missing from the env template, the service may only fail when somebody runs the stack in a fresh environment.

The same class of issue can show up in:

- GitHub Actions secrets;
- GitLab CI variables;
- CircleCI environment variables;
- Vercel project settings;
- Next.js server-only secrets;
- local `.env` files that accumulate stale variables.

The common thread is not secret management. It is deployment readiness.

## What to check in an AI-assisted PR

When an AI agent changes code or config, I want a quick review loop like this:

1. Did the PR introduce a new env var reference?
2. Is that variable documented in `.env.example` or `.env.dist`?
3. Does the relevant CI/deploy platform also define it?
4. Is the variable server-only or safe for public/client-side use?
5. Did the PR leave stale local variables behind?
6. Can the check run locally before CI burns time?

This can be done manually. In small projects, that may be enough.

The important thing is treating env templates as deployment contracts, not as optional documentation.

## Why I built Secret Coverage

I am building Secret Coverage for this specific class of boring failure.

It is a local-first, metadata-only CLI that checks whether environment variables referenced by CI/CD and deployment files are covered by the repo's env template.

It is not a secrets manager. It does not replace Vault, Doppler, Infisical, AWS Secrets Manager, or runtime schema loaders. It does not need a cloud account to run.

The goal is narrower:

```txt
Detect missing environment variables before your deployment fails.
```

A typical local check looks like this:

```bash
npx @leviro-ai/secret-coverage scan --ci --path . --env-template .env.example
```

The useful output is not the secret value. Secret Coverage should never print raw secret values.

The useful output is the metadata mismatch:

```txt
STRIPE_SECRET_KEY is used in .github/workflows/deploy.yml but missing from .env.example.
```

That is enough to stop a broken deploy before it becomes a CI surprise.

## AI makes this more important, not less

AI coding agents are not the problem by themselves.

The problem is that they increase the speed and volume of change around hidden deployment contracts.

A human can review application logic and still miss the operational assumption added three files away. A workflow can be valid YAML and still reference a secret nobody configured. A Docker Compose file can be valid and still assume a missing `REDIS_URL`.

As AI-assisted development becomes normal, these checks need to move closer to the PR.

Not as a heavyweight governance process.

As a small deterministic check before merge, before CI, and before deploy.

## A practical checklist

For any AI-assisted PR that touches deployment-sensitive code, check:

- new `process.env.*` references;
- CI workflow `secrets.*` and `env.*` references;
- Docker Compose `${VAR}` references;
- Vercel or platform config env entries;
- whether `.env.example` / `.env.dist` was updated;
- whether local-only variables are stale or accidentally undocumented;
- whether any public/client env var naming is intentional.

If you do this manually, the checklist is still useful.

If you want a deterministic local check for the same category, Secret Coverage is here:

- GitHub: `https://github.com/leviro-ai/secret-coverage`
- npm: `https://www.npmjs.com/package/@leviro-ai/secret-coverage`

The category I care about is simple: deployment drift detection.

AI agents generate code fast. Configuration drift breaks production later.
