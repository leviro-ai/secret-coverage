# Deployment failed because an environment variable was missing

A deployment that fails because an environment variable is missing usually means the application, CI workflow, or platform config started depending on a name that was never added to the repo's env contract.

The secret value might exist in production, staging, a teammate's laptop, or nowhere at all. The first safe debugging step is not to print secrets. It is to compare variable **names** across the files that define deployment expectations.

Secret Coverage is built for that metadata-only check.

## Fast triage

Run the scanner from the repository root:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --ci
```

If the project keeps the env contract somewhere other than `.env.example` or `.env.dist`, point at it explicitly:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --ci --env-template config/env.template
```

For a monorepo app:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --ci --path apps/web
```

The useful signal is a variable name and where it was referenced, for example:

```txt
STRIPE_SECRET_KEY is used in .github/workflows/deploy.yml but missing from .env.example.
```

That tells you what to review without exposing the secret value.

## What to compare manually

If a deployment already failed, compare these surfaces:

1. **Env contract** — `.env.example`, `.env.dist`, or the template your team expects every app to keep current.
2. **CI/CD config** — GitHub Actions, GitLab CI, CircleCI, deploy scripts, Dockerfiles, and Docker Compose files.
3. **Runtime platform config** — Vercel, Railway, Render, Fly.io, Firebase, CapRover, Coolify, Kubernetes, or other platform settings.
4. **Application code** — especially server-only references such as `process.env.STRIPE_SECRET_KEY`.
5. **Recent PRs** — AI-generated changes often add workflow or config references without updating the template.

The goal is to answer two questions:

- Is the variable name documented in the env template?
- Is the value configured in the deployment environment that just failed?

## Common root causes

### A new CI secret was referenced but not documented

A workflow starts using a variable:

```yaml
env:
  STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
```

But `.env.example` never gained:

```dotenv
STRIPE_SECRET_KEY=
```

Fix the contract and configure the real value in the CI or deployment platform.

### A Docker Compose service references a missing variable

```yaml
services:
  worker:
    environment:
      REDIS_URL: ${REDIS_URL}
```

If the template omits `REDIS_URL`, a teammate can run locally while CI or a preview deploy fails later.

### A server secret was added in application code

```ts
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '');
```

The code changed, but the env template and deployment checklist did not. This is common after generated PRs or quick payment/webhook integrations.

## Safe fix pattern

1. Add the missing variable name to the env template with an empty value:

   ```dotenv
   STRIPE_SECRET_KEY=
   ```

2. Configure the actual secret value in the relevant platform or CI settings.
3. Re-run the scanner:

   ```bash
   pnpm dlx @leviro-ai/secret-coverage scan --ci
   ```

4. Commit the template/config change, not the secret value.
5. Re-run the failed deployment.

## What not to do

- Do not paste secret values into GitHub issues, PR comments, CI logs, or chat.
- Do not commit `.env.local` just to make a deploy pass.
- Do not silence the failure by replacing a missing secret with a placeholder production value.
- Do not rely on one developer's local env as the deployment contract.

## Add a CI guard

After fixing the immediate failure, add Secret Coverage to CI so future PRs fail before deployment:

```yaml
name: Secret Coverage

on:
  pull_request:
  push:
    branches: [main]

jobs:
  secret-coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: leviro-ai/secret-coverage@v0.2.0
        with:
          strict: 'false'
          format: markdown
```

Use `strict: 'true'` when you also want warnings to block the PR.

## Related walkthroughs

- [GitHub Actions missing-secrets troubleshooting](github-actions-missing-secrets-troubleshooting.md)
- [Docker Compose environment variable troubleshooting](docker-compose-env-variable-troubleshooting.md)
- [CI/CD environment variable validation checklist](ci-cd-env-validation-checklist.md)
- [AI-agent PR environment review walkthrough](ai-agent-pr-env-review-walkthrough.md)
