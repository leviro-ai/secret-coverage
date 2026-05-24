# Monorepo env validation: start with one deploy path

Monorepos make environment drift easier to hide. A repository can contain a web app, workers, scripts, packages, examples, and old deployment files. If you scan everything at once, the first report can feel noisy even when the real deployment risk lives in one app.

A safer rollout is to treat each deployable app as its own environment contract and scan one path at a time.

## The failure mode

A common layout looks like this:

```txt
apps/
  web/
    .env.example
    next.config.js
    .github/workflows/deploy-web.yml
  worker/
    .env.example
    docker-compose.yml
packages/
  ui/
  config/
```

The web app may need `NEXT_PUBLIC_API_URL` and `STRIPE_SECRET_KEY`. The worker may need `REDIS_URL` and `QUEUE_SECRET`. Those are different deployment contracts.

If a PR changes only `apps/web`, reviewers should not have to reason about every package in the repository before catching a missing web env var.

## Start with the deployable unit

Run Secret Coverage against the app that actually deploys:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path apps/web --ci
```

If your repo uses a non-standard env template name, pass it explicitly relative to the scanned path:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path apps/web --env-template .env.dist --ci
```

For local development inside this repository, keep the pnpm argument separator:

```bash
pnpm scan -- --path examples/demos/github-actions-missing-secret --ci
```

## Review one env contract at a time

For `apps/web`, check that the template names every required web variable:

```dotenv
NEXT_PUBLIC_API_URL=
STRIPE_SECRET_KEY=
SESSION_SECRET=
```

Then review only the deployment surfaces that belong to that app:

```txt
apps/web/.github/workflows/deploy-web.yml
apps/web/vercel.json
apps/web/next.config.js
apps/web/src/**
```

A useful first PR check is narrow:

```yaml
name: web-env-contract

on:
  pull_request:
    paths:
      - 'apps/web/**'
      - '.github/workflows/web-env-contract.yml'

jobs:
  env-contract:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: pnpm dlx @leviro-ai/secret-coverage scan --path apps/web --ci
```

That check answers one question: did the web app introduce deployment env assumptions that its own template does not document?

## Add another path after the first one is boring

Once the web check is stable, add a separate worker check instead of broadening the first job:

```yaml
name: worker-env-contract

on:
  pull_request:
    paths:
      - 'apps/worker/**'
      - '.github/workflows/worker-env-contract.yml'

jobs:
  env-contract:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: pnpm dlx @leviro-ai/secret-coverage scan --path apps/worker --ci
```

Separate checks make the output easier to act on:

- web reviewers see web env drift;
- worker reviewers see worker env drift;
- shared packages do not create deployment noise unless they are part of a deployable path;
- teams can decide which path should fail CI first.

## When to scan the whole repo

A whole-repo scan is still useful for audits, migrations, or release-readiness reviews:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path . --ci
```

Use it after narrow checks are trusted, not as the first onboarding step for a large repo.

## Monorepo rollout checklist

- [ ] List deployable units: web app, API, worker, scheduled job, docs site.
- [ ] Choose the first path that deploys most often.
- [ ] Confirm that path has a clear `.env.example` or `.env.dist` contract.
- [ ] Run `scan --path <deployable>` locally.
- [ ] Add a path-scoped CI check before the deploy job.
- [ ] Add the next deployable path only after the first report is stable.
- [ ] Keep raw secret values out of templates, docs, and CI output.

The goal is not to scan a monorepo perfectly on day one. The goal is to make one deployment path boring, then repeat the pattern.

## Related docs

- [CI/CD environment variable validation checklist](ci-cd-env-validation-checklist.md)
- [AI-agent PR environment review walkthrough](ai-agent-pr-env-review-walkthrough.md)
- [Preview environment variable checklist](preview-environment-variable-checklist.md)
