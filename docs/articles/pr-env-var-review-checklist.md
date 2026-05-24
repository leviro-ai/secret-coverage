# Pull request env var review checklist

Environment variable drift usually enters a project in a pull request: a workflow starts using a new secret, a Docker service gets another `${VAR}`, or a worker gains a runtime dependency that never lands in `.env.example`.

Use this checklist when reviewing PRs that touch deployment, CI, app startup, background jobs, or infrastructure config. It is designed to stay metadata-only: reviewers need variable names and files, not raw secret values.

## The 5-minute review

Before approving a PR, check four things:

1. **New env references** — did the PR add `process.env.X`, `${X}`, `$X`, a CI secret, a Docker build arg, or a platform config variable?
2. **Env template updates** — does `.env.example` or `.env.dist` include every required variable name?
3. **Runtime scope** — is the variable needed by the app, worker, migration, preview deploy, production deploy, or CI job?
4. **Safe placeholders** — did the PR add empty placeholders or dummy public config, not raw secret values?

Then run a deterministic scan:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path . --ci
```

For a monorepo, start with the deployable that changed:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path apps/web --ci
```

## Example: workflow changed, env template did not

A PR adds a deployment token to GitHub Actions:

```yaml
name: Deploy

jobs:
  deploy:
    runs-on: ubuntu-latest
    env:
      DEPLOY_API_TOKEN: ${{ secrets.DEPLOY_API_TOKEN }}
    steps:
      - uses: actions/checkout@v4
      - run: pnpm deploy
```

But the env template still only documents the app URL:

```dotenv
NEXT_PUBLIC_APP_URL=
```

That is a contract drift. The secret value may already exist in GitHub Actions, but reviewers cannot tell from the repository that `DEPLOY_API_TOKEN` is now required.

Fix the contract without exposing the value:

```dotenv
NEXT_PUBLIC_APP_URL=
DEPLOY_API_TOKEN=
```

Secret Coverage should report the missing variable before the fix and pass once the template is updated.

## Files that deserve extra attention

Review env contracts when a PR changes files like these:

| Area | Files to inspect | Common drift |
| --- | --- | --- |
| GitHub Actions | `.github/workflows/*.yml` | `${{ secrets.NAME }}` added without template update |
| GitLab CI | `.gitlab-ci.yml` | `$DEPLOY_TOKEN` or `$PREVIEW_URL` introduced in scripts |
| CircleCI | `.circleci/config.yml` | context-backed deploy vars not reflected in `.env.dist` |
| Docker | `Dockerfile`, `docker-compose.yml` | `${DATABASE_URL}` or build `ARG` added late |
| App source | Next.js/API/worker files | `process.env.STRIPE_SECRET_KEY` added in code review noise |
| Platform config | `vercel.json`, deploy config, infra files | runtime env names drift from repo docs |

## What to ask in review

Use these questions in a PR comment or checklist:

- Does this PR introduce any new environment variable names?
- Are all required names present in `.env.example` or `.env.dist`?
- Are public browser variables clearly prefixed, for example `NEXT_PUBLIC_*` where the framework expects it?
- Are server-only secrets kept out of client-side code and public docs?
- Are preview, staging, production, workers, migrations, and cron jobs using the same contract where they should?
- Did we add placeholders only, not raw secret values?
- Did `secret-coverage scan --ci` run on the changed deployable path?

## When not to fail the PR

Not every warning should block a merge on day one. If the repo has never had an env contract, start with critical missing-template findings and fix one deployable at a time.

A practical rollout:

1. Add or clean up `.env.example` / `.env.dist`.
2. Run Secret Coverage locally with `--ci`.
3. Fix critical missing variables for the changed app or job.
4. Add the check to CI after the first noisy edges are resolved.
5. Move to stricter review rules later if the team wants warnings to block merges.

## Copy-paste PR checklist

```md
### Env contract review

- [ ] I checked whether this PR adds new env references in source, CI, Docker, or deploy config.
- [ ] Required variable names are documented in `.env.example` or `.env.dist`.
- [ ] No raw secret values were added to templates, docs, logs, or fixtures.
- [ ] Preview/staging/production/worker scopes were considered where relevant.
- [ ] I ran `pnpm dlx @leviro-ai/secret-coverage scan --path . --ci` or a scoped `--path` check.
```

## Why this matters

A PR can look safe in code review while quietly adding a deployment requirement. The failure then appears later as a broken CI job, preview deploy, worker boot, webhook handler, migration, or production release.

Treat the env template as the repository contract. Keep secret values in the secret manager or deployment platform. Use a deterministic metadata-only check to catch the gap between the two before merge.
