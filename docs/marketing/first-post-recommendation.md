# First public post recommendation — GitHub Actions deployment drift demo

Status: recommendation only. Do not publish until Darius approves the channel and final wording.

## Recommendation

Publish the first public post on **Dev.to**.

Why Dev.to first:

- It supports a concrete technical walkthrough with YAML, dotenv, CLI output, and links without forcing the post into a thin launch format.
- The existing demo/article asset is already enough for a useful standalone post.
- It is lower-risk than Reddit because subreddit-specific self-promotion rules do not need to be navigated first.
- It is stronger than X/Twitter for the first artifact because the full context is visible in one page and can become a canonical link for later short posts.
- Hacker News should wait for at least one more concrete demo or a stronger problem-first article; the current HN notes correctly flag the artifact as still thin for Show HN.

Recommended timing: post Dev.to first, then wait for real feedback/metrics before adapting the same idea for Reddit or X/Twitter. Do not cross-post identical wording on the same day.

## Approval needed

Ask Darius to approve one of these options before posting:

1. **Approve Dev.to post as written below** — publish through the already-open CloakBrowser session.
2. **Approve after edits** — Darius can adjust title/tone/link density.
3. **Do not post yet** — add another demo first, likely Docker Compose, Vercel, CircleCI, or Supabase drift.

## Recommended title

`Catch missing GitHub Actions secrets before deploy`

## Recommended tags

- `githubactions`
- `devops`
- `node`
- `opensource`

## Final Dev.to text for approval

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

## Risk notes

- **Main risk:** sounding like a launch announcement instead of a useful failure-pattern note. Keep the title and opening problem-first.
- **Link risk:** three links at the end are acceptable on Dev.to, but if Darius wants softer framing, publish with only the demo fixture + GitHub repo.
- **Technical challenge risk:** readers may compare this to env schema validation. Calm answer: schema validation is useful inside app/runtime; this catches CI/CD and deployment-config references drifting from the repo contract before app startup.
- **Trust risk:** do not claim users, adoption, stars, testimonials, or broad platform coverage. Say it is early and fixture-driven.

## Post-publish checklist

If Darius approves publishing:

- [ ] Re-run `pnpm scan -- --path examples/demos/github-actions-missing-secret --ci` and confirm output still matches.
- [ ] Confirm npm latest and GitHub links still resolve.
- [ ] Publish through the already-open CloakBrowser Dev.to session.
- [ ] Record the Dev.to URL and only real observed metrics in `docs/marketing/metrics-log.md`.
- [ ] Do not cross-post to Reddit/HN/X on the same day.
