# Dev.to draft — Catch a missing GitHub Actions secret before deploy

Status: reviewed for link readiness, but still draft only. Do not publish until Darius reviews channel framing.

## Goal

Turn the repo-hosted GitHub Actions missing-secret demo into a useful Dev.to post for developers who have seen CI/CD fail because a workflow referenced an env var or secret that was not documented in `.env.example` / `.env.dist`.

Positioning: deployment drift detection / CI/CD environment validation / deployment readiness. Avoid generic security-tool framing and avoid broad claims.

## Title options

1. `Catch missing GitHub Actions secrets before deploy`
2. `A tiny CI/CD drift bug: GitHub Actions secret added, env template forgotten`
3. `How to detect missing environment variables before GitHub Actions deploys`
4. `Stop finding missing env vars only after your deploy job fails`

Recommended first title: **Catch missing GitHub Actions secrets before deploy**

## Tags

Recommended Dev.to tags:

- `githubactions`
- `devops`
- `node`
- `opensource`

Optional swap if the post leans more AI-agent focused: replace `node` with `ai`.

## Canonical links / assets

Use these after the demo/article assets are committed and visible on GitHub:

- npm: `https://www.npmjs.com/package/@leviro-ai/secret-coverage`
- GitHub repo: `https://github.com/leviro-ai/secret-coverage`
- Demo fixture: `https://github.com/leviro-ai/secret-coverage/tree/main/examples/demos/github-actions-missing-secret`
- Repo article source: `https://github.com/leviro-ai/secret-coverage/blob/main/docs/articles/github-actions-missing-secret.md`

Link-readiness review 2026-05-22: npm latest is `0.1.5`, repository URL is `git+https://github.com/leviro-ai/secret-coverage.git`, and the GitHub URLs above are expected to resolve after the demo/article/content bundle is pushed to `main`.

## Draft body

A small deployment failure pattern I keep seeing:

1. A GitHub Actions workflow starts using a new secret.
2. The repo's `.env.example` or `.env.dist` is not updated.
3. The mismatch is discovered later, usually during a deploy job or production config check.

The code change can look harmless:

```yaml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
```

But if the env template only documents this:

```dotenv
NEXT_PUBLIC_APP_URL=https://example.com
DATABASE_URL=
```

then `STRIPE_SECRET_KEY` has become an undocumented deployment requirement.

That is deployment drift: CI/CD expects something the repository contract does not describe.

I made a small open-source demo fixture for this case:

```txt
examples/demos/github-actions-missing-secret/
├── .env.example
└── .github/workflows/deploy.yml
```

Run it with Secret Coverage:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path examples/demos/github-actions-missing-secret --ci
```

In the repo itself, the equivalent dev command is:

```bash
pnpm scan -- --path examples/demos/github-actions-missing-secret --ci
```

Expected output:

```md
# Secret Coverage Report

Readiness score: **73/100**

Critical: 1 · Warning: 0 · Info: 1

## Critical

- **STRIPE_SECRET_KEY** — STRIPE_SECRET_KEY is used in .github/workflows/deploy.yml but missing from an env template.
  - Context: `.github/workflows/deploy.yml` · `missing-from-template`
  - Fix: Add STRIPE_SECRET_KEY= to an env template and configure the value in your deployment environment.
```

The point is not to read or expose secret values. The check only compares metadata:

- variables documented by env templates;
- variables referenced by workflow/config files;
- mismatches that should be fixed before deployment.

A minimal fix is to update the env template:

```dotenv
NEXT_PUBLIC_APP_URL=https://example.com
DATABASE_URL=
STRIPE_SECRET_KEY=
```

Then configure the real `STRIPE_SECRET_KEY` value in GitHub Actions secrets.

This is especially useful when AI-assisted PRs update application code and CI config quickly, because env contracts are easy to forget during review.

Secret Coverage is local-first and deterministic. It is not a vault and it does not need a cloud account for this check.

Links:

- npm: https://www.npmjs.com/package/@leviro-ai/secret-coverage
- GitHub: https://github.com/leviro-ai/secret-coverage
- Demo fixture: https://github.com/leviro-ai/secret-coverage/tree/main/examples/demos/github-actions-missing-secret

## Pre-publish checklist

- [ ] Confirm current working tree changes are committed/pushed so GitHub demo links resolve.
- [ ] Re-run `pnpm scan -- --path examples/demos/github-actions-missing-secret --ci` and confirm output still matches the quoted report.
- [ ] Verify npm latest is still `@leviro-ai/secret-coverage@0.1.5` or update wording if a new version exists.
- [ ] Keep tone educational; do not claim users, traction, testimonials, or comparisons that do not exist.
- [ ] Publish as a helpful technical note, not as launch spam.
- [ ] After posting, record the URL and real observable metrics in `docs/marketing/metrics-log.md`.

## Reuse notes for other channels

- Reddit: rewrite as a discussion prompt around deployment drift and only link if subreddit rules allow it.
- Hacker News: wait for a stronger public artifact or Show HN angle; avoid submitting a thin promo link.
- X/Twitter: use a short thread with the YAML/env mismatch and one screenshot-ready report snippet.
