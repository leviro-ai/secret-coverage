# SaaS deployment readiness env checklist

Small SaaS teams often ship with enough deployment process to move fast, but not enough process to catch environment drift early. A release can pass code review and still fail because a worker, migration, CI job, or preview deploy expects a variable that is not documented in the repo contract.

Use this checklist before merging release, deploy, infrastructure, or AI-generated changes. It focuses on variable names and files only. Do not copy raw secret values into docs, templates, screenshots, or pull request comments.

## The release question

Before a deploy, ask:

> Can a new developer, CI job, or preview environment infer every required environment variable name from the repository without seeing secret values?

If the answer is no, the project has an env contract gap. The secret may exist in Vercel, GitHub Actions, Railway, Docker, or a secret manager, but the repository no longer describes what deployment requires.

## 10-minute checklist

Review these surfaces before a release:

1. **Env baseline** — `.env.example` or `.env.dist` lists every required variable name with empty or fake-safe placeholders.
2. **CI workflows** — GitHub Actions, GitLab CI, CircleCI, and deploy scripts do not reference undocumented `$VARS` or `${{ secrets.NAME }}`.
3. **App startup** — server code, API routes, background workers, and cron jobs do not introduce hidden `process.env.X` requirements.
4. **Deploy config** — Docker, Docker Compose, Vercel, Render, Railway, Fly.io, Kubernetes, or similar config is aligned with the same contract.
5. **Preview and staging** — preview apps and staging jobs use the same required names where parity matters.
6. **Migrations and one-off jobs** — database migrations, seed scripts, queues, and scheduled jobs get their required variables documented too.
7. **Public vs server-only scope** — browser-exposed variables use the framework’s public prefix where required, and server-only secrets stay out of client code.
8. **Secret-manager boundary** — real values stay in the deployment platform or secret manager; templates contain names only.
9. **Monorepo scope** — validate the deployable app that changed first instead of forcing the entire monorepo into one contract.
10. **PR evidence** — the PR includes a scan command or reviewer note showing the env contract was checked.

## Run a deterministic check

From the repo root:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path . --ci
```

For monorepos, start with one deployable path:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path apps/web --ci
```

If your repo uses `.env.dist` instead of `.env.example`, make that explicit:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path apps/web --env-template .env.dist --ci
```

The goal is not to prove that secret values are correct. The goal is to catch references to required variable names that the repository contract forgot to document.

## Example failure mode

A small team adds a billing webhook and a deploy workflow in the same PR:

```ts
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
```

```yaml
jobs:
  deploy:
    env:
      STRIPE_WEBHOOK_SECRET: ${{ secrets.STRIPE_WEBHOOK_SECRET }}
    steps:
      - run: pnpm deploy
```

But `.env.example` still only has:

```dotenv
NEXT_PUBLIC_APP_URL=
DATABASE_URL=
```

The deploy might work on one environment because the secret already exists there, then fail in preview, staging, a worker, or a new account. Fix the contract by adding the required name without a value:

```dotenv
NEXT_PUBLIC_APP_URL=
DATABASE_URL=
STRIPE_WEBHOOK_SECRET=
```

## What should block the release?

A practical policy for a small SaaS team:

| Finding | Default release action |
| --- | --- |
| Required env var referenced by CI/deploy/source but missing from `.env.example` or `.env.dist` | Block until documented or removed |
| Raw secret value committed to docs, templates, fixtures, or logs | Block and rotate if needed |
| Variable exists in local `.env` but is unused or stale | Warn; clean up when safe |
| Optional integration var absent from the template | Warn unless that integration is enabled in this deploy |
| New platform integration with unclear env scope | Block until the owner documents required names |

Start with critical blockers only. Once the baseline is clean, teams can decide whether warnings should fail PRs too.

## Copy-paste PR comment

```md
### Deployment readiness env check

- [ ] This PR does not introduce undocumented env variable names.
- [ ] Required names are present in `.env.example` or `.env.dist` with no raw secret values.
- [ ] CI/deploy config, app startup, workers, migrations, and preview/staging/prod scopes were checked where relevant.
- [ ] Public browser variables and server-only secrets are scoped correctly.
- [ ] I ran `pnpm dlx @leviro-ai/secret-coverage scan --path . --ci` or a scoped `--path` scan for the changed app.
```

## Keep it boring

Deployment readiness should be boring. A repo contract with complete variable names, empty placeholders, and deterministic checks is usually enough to prevent the “one missing env var broke the deploy” class of failures.

Keep real values in your secret manager or deployment platform. Keep required names visible in the repo. Run the check before CI, preview, staging, or production has to discover the drift for you.
