# First public post recommendation — deployment drift demos

Status: recommendation only. Do not publish until Darius approves the channel and final wording.

## Recommendation

Publish the first public post on **Dev.to**, now framed around two concrete drift examples:

1. GitHub Actions references `STRIPE_SECRET_KEY`, but the env template does not document it.
2. Docker Compose references `REDIS_URL`, but the env template does not document it.

Keep those two examples as the body of the first post. Vercel and CircleCI demos are now available, but they should be mentioned only as optional follow-up links near the end so the article does not turn into a broad product tour.

Why Dev.to first:

- It supports a concrete technical walkthrough with YAML, dotenv, CLI output, and links without forcing the post into a thin launch format.
- Two small demos make the point stronger: deployment drift is not only a GitHub Actions issue; it also appears in service/runtime config.
- It is lower-risk than Reddit because subreddit-specific self-promotion rules do not need to be navigated first.
- It is stronger than X/Twitter for the first artifact because the full context is visible in one page and can become a canonical link for later short posts.
- Hacker News should still wait for a stronger Show HN angle or a broader technical write-up; the current HN notes correctly flag that a thin link is risky.

Recommended timing: post Dev.to first, then wait for real feedback/metrics before adapting the same idea for Reddit or X/Twitter. Do not cross-post identical wording on the same day.

## Approval needed

Ask Darius to approve one of these options before posting:

1. **Approve Dev.to post as written below** — publish through the already-open CloakBrowser Dev.to session.
2. **Approve after edits** — Darius can adjust title/tone/link density.
3. **Do not post yet** — add another demo first, likely Vercel, CircleCI, Supabase, or a real-repo walkthrough.

Current recommendation after adding Vercel and CircleCI demos: **do not expand the main article beyond the GitHub Actions + Docker Compose walkthrough**. If Darius wants to show breadth, add a short “More fixture examples” note with the Vercel and CircleCI links instead of adding two more sections.

## Recommended title

`Two tiny deployment drift bugs: env vars added, templates forgotten`

Alternative titles:

- `Catch missing environment variables before your deploy job does`
- `A GitHub Actions secret and a Docker Compose env var walk into a failed deploy`
- `How env templates drift from CI/CD and Docker config`

## Recommended tags

- `devops`
- `githubactions`
- `docker`
- `opensource`

## Final Dev.to text for approval

A small deployment failure pattern I keep seeing:

1. A config file starts using a new environment variable or secret.
2. The repo's `.env.example` or `.env.dist` is not updated.
3. The mismatch is discovered later, usually during a deploy job, local preview, worker boot, or production config check.

The bug is rarely dramatic in code review. It can be as small as one extra variable in CI/CD or Docker config.

### Example 1: GitHub Actions secret drift

A workflow starts using a new secret:

```yaml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
```

But the env template only documents this:

```dotenv
NEXT_PUBLIC_APP_URL=https://example.com
DATABASE_URL=
```

Now `STRIPE_SECRET_KEY` has become an undocumented deployment requirement.

Run the demo fixture with Secret Coverage:

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

### Example 2: Docker Compose runtime drift

The same thing can happen outside CI. A Compose file starts expecting Redis:

```yaml
services:
  web:
    environment:
      APP_ENV: ${APP_ENV}
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}

  worker:
    environment:
      REDIS_URL: ${REDIS_URL}
```

But `.env.example` only documents:

```dotenv
APP_ENV=production
DATABASE_URL=
```

Now both the web service and worker depend on `REDIS_URL`, but the repository contract does not say so.

Run the demo fixture:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path examples/demos/docker-compose-missing-redis-url --ci
```

Expected output:

```md
# Secret Coverage Report

Readiness score: **71/100**

Critical: 1 · Warning: 0 · Info: 2

## Critical

- **REDIS_URL** — REDIS_URL is used in docker-compose.yml but missing from an env template.
  - Context: `docker-compose.yml` · `missing-from-template`
  - Fix: Add REDIS_URL= to an env template and configure the value in your deployment environment.
```

That is deployment drift: deployment/runtime config expects something the repository's declared env contract does not describe.

The point is not to read or expose secret values. The check only compares metadata:

- variables documented by env templates;
- variables referenced by CI/CD, Docker, and config files;
- mismatches that should be fixed before deployment.

A minimal fix is to update the env template:

```dotenv
# GitHub Actions example
NEXT_PUBLIC_APP_URL=https://example.com
DATABASE_URL=
STRIPE_SECRET_KEY=

# Docker Compose example
APP_ENV=production
DATABASE_URL=
REDIS_URL=
```

Then configure the real values in GitHub Actions secrets, Docker/Compose runtime environment, or the deployment platform.

This is especially useful when AI-assisted PRs update application code and config quickly, because env contracts are easy to forget during review.

Secret Coverage is local-first and deterministic. It is not a vault and it does not need a cloud account for this check.

Links:

- npm: https://www.npmjs.com/package/@leviro-ai/secret-coverage
- GitHub: https://github.com/leviro-ai/secret-coverage
- GitHub Actions demo: https://github.com/leviro-ai/secret-coverage/tree/main/examples/demos/github-actions-missing-secret
- Docker Compose demo: https://github.com/leviro-ai/secret-coverage/tree/main/examples/demos/docker-compose-missing-redis-url

Optional follow-up examples if Darius wants one extra breadth note:

- Vercel demo: https://github.com/leviro-ai/secret-coverage/tree/main/examples/demos/vercel-missing-supabase-key
- CircleCI demo: https://github.com/leviro-ai/secret-coverage/tree/main/examples/demos/circleci-missing-deploy-key

Suggested one-sentence placement before the links: `There are a few more small fixture examples in the repo, including Vercel config drift and CircleCI deploy-key drift, but I would keep this first post focused on the two cases above.`

## Risk notes

- **Main risk:** sounding like a launch announcement instead of a useful failure-pattern note. Keep the title and opening problem-first.
- **Link risk:** four core links at the end are acceptable on Dev.to. Adding the Vercel/CircleCI links is okay only as an optional follow-up note; do not turn the post into a list of every supported surface.
- **Technical challenge risk:** readers may compare this to env schema validation. Calm answer: schema validation is useful inside app/runtime; this catches CI/CD and deployment-config references drifting from the repo contract before app startup.
- **Trust risk:** do not claim users, adoption, stars, testimonials, or broad platform coverage. Say it is early and fixture-driven.
- **Scope risk:** avoid implying full Docker/Kubernetes/platform coverage. This post demonstrates specific static config drift patterns only.

## Post-publish checklist

If Darius approves publishing:

- [ ] Re-run `pnpm scan -- --path examples/demos/github-actions-missing-secret --ci` and confirm output still matches.
- [ ] Re-run `pnpm scan -- --path examples/demos/docker-compose-missing-redis-url --ci` and confirm output still matches.
- [ ] If the optional breadth note is included, re-run the Vercel and CircleCI demo scans too.
- [ ] Confirm npm latest and GitHub links still resolve.
- [ ] Publish through the already-open CloakBrowser Dev.to session.
- [ ] Record the Dev.to URL and only real observed metrics in `docs/marketing/metrics-log.md`.
- [ ] Do not cross-post to Reddit/HN/X on the same day.
