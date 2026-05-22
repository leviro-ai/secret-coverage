# Reddit draft — GitHub Actions deployment drift discussion

Status: draft only. Do not post until Darius reviews channel fit, subreddit rules, and final wording.

## Goal

Use the GitHub Actions missing-secret demo as a technical discussion starter, not a promotional launch post. The useful angle is deployment drift: a workflow references a secret or env var that the repo contract (`.env.example` / `.env.dist`) does not document, so the mismatch is found late in CI/CD or production deployment.

Positioning: deployment drift detection / CI/CD environment validation / deployment readiness. Avoid broad security-tool framing, testimonials, traction claims, or cross-post spam.

## Subreddit fit notes

Potential communities to evaluate manually before posting:

- `r/devops`
  - Best fit if framed as a workflow/release-readiness discussion.
  - Avoid tool-first title. Ask how teams prevent `.env.example` drift from CI/CD config.
  - Link only if self-promotion rules allow it and the post has enough standalone detail.
- `r/github`
  - Possible fit if focused tightly on GitHub Actions env/secret references.
  - Keep the post concrete and small; avoid generic DevOps/product language.
- `r/node`
  - Possible fit only if framed around Node app deploys and env contracts.
  - Less ideal than `r/devops` because the issue is CI/CD workflow drift, not Node-specific.
- `r/programming` / broad launch communities
  - Not recommended yet. Wait for a stronger article, release story, or broader demo set.

Recommended first target if rules allow: **r/devops**.

## Title options

Discussion-first options:

1. `How do you catch CI/CD env drift before a GitHub Actions deploy fails?`
2. `GitHub Actions drift: workflow adds a secret, .env.example is forgotten`
3. `Do you treat .env.example as a deploy contract?`
4. `Small CI/CD failure pattern: missing env vars discovered only during deploy`

Recommended first title: **How do you catch CI/CD env drift before a GitHub Actions deploy fails?**

## Draft body — discussion-first, link-light

I keep running into a small but annoying deployment failure pattern:

1. A GitHub Actions workflow starts using a new secret/env var.
2. `.env.example` or `.env.dist` is not updated.
3. The missing requirement is discovered later, usually during deploy.

Example:

```yaml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
```

But the repo contract only says:

```dotenv
NEXT_PUBLIC_APP_URL=https://example.com
DATABASE_URL=
```

So `STRIPE_SECRET_KEY` is required by CI/CD, but missing from the documented environment contract.

How are people catching this in review?

- schema around env vars?
- CI checks against `.env.example` / `.env.dist`?
- custom scripts?
- conventions for keeping GitHub Actions secrets aligned with app config?

I made a tiny deterministic fixture/check for this because I wanted a local-first way to catch the mismatch before deploy. The check only compares metadata: variables documented by env templates vs variables referenced by workflow/config files. It does not need secret values.

If links are allowed, the demo fixture is here: https://github.com/leviro-ai/secret-coverage/tree/main/examples/demos/github-actions-missing-secret

Main question: what approach has been lowest-noise for your team? I care more about avoiding false positives than catching every possible config pattern.

## Alternate shorter body — if subreddit is strict about links

I keep seeing this CI/CD drift pattern:

```yaml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
```

But `.env.example` only documents:

```dotenv
NEXT_PUBLIC_APP_URL=https://example.com
DATABASE_URL=
```

Now the workflow has a new deployment requirement that the repo contract does not describe.

How do you catch this before deploy?

- env schema?
- CI validation?
- custom scripts?
- PR review checklist?

I am experimenting with a local-first metadata-only check that compares env templates against CI/CD config references, but I am curious what has actually stayed low-noise in real teams.

## Optional links

Use only if allowed by subreddit rules and after Darius review:

- Demo fixture: https://github.com/leviro-ai/secret-coverage/tree/main/examples/demos/github-actions-missing-secret
- Article source: https://github.com/leviro-ai/secret-coverage/blob/main/docs/articles/github-actions-missing-secret.md
- npm: https://www.npmjs.com/package/@leviro-ai/secret-coverage

Prefer one link max in the body for Reddit. Put the rest in a comment only if someone asks or if rules allow project links.

## No-spam / pre-post checklist

- [ ] Confirm subreddit rules allow project/demo links or use the no-link version.
- [ ] Post to at most one subreddit first; do not cross-post the same wording.
- [ ] Keep the title discussion-first, not tool-first.
- [ ] Do not claim users, adoption, stars, feedback, or authority that does not exist.
- [ ] Do not use generic launch language.
- [ ] Re-run `pnpm scan -- --path examples/demos/github-actions-missing-secret --ci` before posting if quoting output.
- [ ] After posting, record the URL and only real observed metrics in `docs/marketing/metrics-log.md`.

## Channel-specific notes

- If the first comments ask for the tool, share the GitHub link transparently and say it is an early open-source project.
- If commenters suggest env schema or type-safe config tools, collect those as integration/positioning feedback instead of arguing.
- If the post is removed or downvoted, do not repost immediately. Record the outcome and revise the artifact/channel choice.
