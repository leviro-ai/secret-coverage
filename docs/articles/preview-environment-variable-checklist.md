# Preview environment variable checklist for deployment reviews

Preview environments are useful because they make every pull request feel deployable. They also create a quiet environment-variable drift problem: a PR can pass local tests while the preview deploy, worker, migration job, or webhook handler is missing a variable that production already has.

This checklist is for reviewing preview deploys without exposing secret values.

## The failure pattern

A preview deploy usually fails in one of these ways:

- the application boots, then crashes when a route reads a missing server-only variable;
- a background worker starts with a different env set than the web service;
- a migration, seed, or release command references a secret that was only configured in production;
- an AI-generated PR adds a provider SDK and a new env var but does not update `.env.example` or `.env.dist`;
- CI passes because the missing variable is only needed by preview runtime config.

The risky part is not the secret value. The risky part is an undocumented deployment contract.

## 1. Compare preview config with the repo contract

Start with the env template files that reviewers can safely inspect:

```dotenv
NEXT_PUBLIC_APP_URL=https://example.com
DATABASE_URL=
```

Then compare them with variables referenced by the preview path:

- CI workflow or preview-deploy workflow;
- Dockerfile and Docker Compose files;
- platform config such as `vercel.json`, `render.yaml`, `netlify.toml`, `railway.json`, or app-platform specs;
- server routes, workers, migration scripts, and scheduled jobs.

If preview config references `STRIPE_SECRET_KEY`, `REDIS_URL`, or `WEBHOOK_SECRET`, the template should document the variable name even though the real value lives in the deployment platform.

## 2. Separate public, server, and job-only variables

Preview failures often happen because teams treat one service as the whole environment. Document which variables belong to each execution path:

```dotenv
# Browser-exposed
NEXT_PUBLIC_APP_URL=https://example.com

# Server/runtime
DATABASE_URL=
STRIPE_SECRET_KEY=
WEBHOOK_SECRET=

# Worker/job runtime
REDIS_URL=
QUEUE_NAME=default
```

Do not put real secret values in the template. Empty values are enough to make the contract visible.

## 3. Check generated or AI-assisted PRs extra carefully

AI-assisted changes often add the code and the config in separate files:

```yaml
# .github/workflows/preview.yml
env:
  STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
```

```ts
// app/api/checkout/route.ts
const stripeKey = process.env.STRIPE_SECRET_KEY;
```

The PR looks internally consistent, but it can still forget the env template update:

```dotenv
NEXT_PUBLIC_APP_URL=https://example.com
DATABASE_URL=
```

A reviewer should ask for the smallest safe fix:

```dotenv
NEXT_PUBLIC_APP_URL=https://example.com
DATABASE_URL=
STRIPE_SECRET_KEY=
```

## 4. Run a metadata-only check before merge

Secret Coverage is designed for this kind of review because it compares variable names, not secret values.

For a consumer repo:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path . --ci
```

In the Secret Coverage repo while developing docs or fixtures:

```bash
pnpm scan -- --path examples/demos/github-actions-missing-secret --ci
pnpm scan -- --path examples/demos/docker-compose-missing-redis-url --ci
pnpm scan -- --path examples/demos/vercel-missing-supabase-key --ci
```

The useful finding is a variable referenced by deployment or runtime config but missing from the repo's declared env template.

## 5. Treat preview-only variables as production-adjacent

Preview values may be lower privilege, but they still need ownership:

- who creates or rotates the preview secret;
- whether the value differs from production;
- whether forks should receive it;
- whether worker and migration previews get the same variable set as web previews;
- whether the variable must be documented in onboarding steps.

Do not solve this by committing real values. Solve it by documenting the variable name and configuring the value in the platform that runs the preview.

## Quick review checklist

Before merging a PR that changes preview deploy behavior, ask:

- [ ] Did any workflow, platform config, Docker file, worker, route, or script start referencing a new env var?
- [ ] Is the variable name documented in `.env.example`, `.env.dist`, or the repo's chosen template file?
- [ ] Are server-only variables separated from public `NEXT_PUBLIC_` / `PUBLIC_` variables?
- [ ] Are worker, migration, cron, and webhook paths covered, not only the web service?
- [ ] Did the review avoid printing raw secret values in comments, logs, screenshots, or docs?
- [ ] Is there a CI check that fails before a missing preview variable becomes a failed deploy?

Preview deploys should make pull requests safer. They should not become a second, undocumented production environment.
