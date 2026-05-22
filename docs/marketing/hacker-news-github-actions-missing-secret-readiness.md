# Hacker News readiness — GitHub Actions deployment drift demo

Status: readiness notes only. Do not submit to Hacker News until Darius reviews whether the artifact is strong enough for HN and approves the final title/body.

## Goal

Decide whether the GitHub Actions missing-secret demo is worth a Hacker News submission, and prepare a restrained Show HN angle that is useful rather than promotional.

HN should not be treated like another distribution checkbox. A thin link to an early CLI or a lightly edited Dev.to article is likely to be ignored or flagged. The current demo is useful as a concrete artifact, but the stronger HN-worthy angle is the deployment-drift problem: CI/CD config can quietly diverge from the repo's documented environment contract.

Positioning: deployment drift detection / CI/CD environment validation / deployment readiness. Avoid generic security-tool framing, launch hype, traction claims, or repeated cross-posting.

## Current artifact fit

Current assets that can support an HN submission after review:

- Demo fixture: https://github.com/leviro-ai/secret-coverage/tree/main/examples/demos/github-actions-missing-secret
- Article source: https://github.com/leviro-ai/secret-coverage/blob/main/docs/articles/github-actions-missing-secret.md
- npm package: https://www.npmjs.com/package/@leviro-ai/secret-coverage
- Repo: https://github.com/leviro-ai/secret-coverage

Current strength:

- Concrete failure case with a minimal GitHub Actions workflow and `.env.example` mismatch.
- Local-first deterministic CLI output.
- Metadata-only trust story: it checks variable names/references, not secret values.
- Useful AI-agent workflow angle: agents can update code/config quickly while env contracts drift.

Current weakness:

- Only one public demo scenario is ready.
- No visual walkthrough, hosted docs page, comparison matrix, or broader corpus of real-world config drift cases yet.
- The README/demo are credible for Dev.to or Reddit discussion, but a Show HN submission may still feel thin unless framed carefully.

Recommendation: **do not submit to HN yet unless Darius wants an early low-stakes validation attempt.** A better first HN attempt would follow at least one more concrete demo or a short public write-up focused on the failure pattern rather than the package.

## What would make it HN-worthy

Before submitting, prefer adding at least one of these:

1. A second concrete demo for another common drift surface, such as Docker Compose, Vercel, Supabase, or CircleCI.
2. A short visual README section or screenshot-ready terminal output that makes the mismatch obvious in under 15 seconds.
3. A concise technical write-up: "Deployment drift is when CI/CD requires env vars your repo contract does not document".
4. A false-positive/trust section showing what Secret Coverage intentionally ignores, because HN readers will challenge noisy scanners.
5. A small set of real-world anonymized patterns, without claiming users or traction.

## Restrained title options

Prefer problem-first titles:

1. `Show HN: Secret Coverage – detect CI/CD env drift before deploy`
2. `Show HN: A local-first check for GitHub Actions env drift`
3. `Secret Coverage: detect when CI config outgrows .env.example`
4. `I built a small check for undocumented deployment env vars`

Recommended if posting soon: **Show HN: Secret Coverage – detect CI/CD env drift before deploy**

Avoid:

- `Launch: Secret Coverage`
- `The best secret scanner for GitHub Actions`
- `Never miss an env var again`
- Any claim about users, stars, popularity, or security coverage that is not observable.

## Draft Show HN body

I built a small local-first CLI for a deployment failure pattern I kept seeing: CI/CD config starts requiring an env var or secret, but the repo's `.env.example` / `.env.dist` is not updated.

Minimal example:

```yaml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
```

But the repo contract only documents:

```dotenv
NEXT_PUBLIC_APP_URL=https://example.com
DATABASE_URL=
```

So `STRIPE_SECRET_KEY` is now required by the deploy workflow but missing from the documented environment contract.

Secret Coverage compares metadata only: variables declared by env templates vs variables referenced by CI/CD/app config. It does not need secret values and it is not a vault.

Demo fixture: https://github.com/leviro-ai/secret-coverage/tree/main/examples/demos/github-actions-missing-secret

I am trying to keep the scanner low-noise rather than broad. Curious how others handle env contract drift in review: schema, custom CI scripts, typed config, or PR checklists?

## If using the article instead of Show HN

HN may respond better to a problem-focused article than a direct package link. If Darius chooses that route, publish or host an article first, then submit with a title like:

- `Deployment drift: when GitHub Actions secrets outgrow .env.example`
- `Catching CI/CD env drift before deploy`

The article should put the tool below the fold and lead with the failure mode, concrete YAML/dotenv mismatch, and low-noise tradeoffs.

## Pre-submit checklist

- [ ] Darius approves posting to HN.
- [ ] Choose either Show HN package/demo or problem-focused article; do not submit both close together.
- [ ] Re-run `pnpm scan -- --path examples/demos/github-actions-missing-secret --ci` and confirm the quoted output/finding is still accurate.
- [ ] Confirm repository links resolve on `main`.
- [ ] Do not cross-post the same wording to Reddit/Dev.to/HN on the same day.
- [ ] Do not claim users, traction, stars, testimonials, or external validation.
- [ ] Be ready to answer false-positive and trust questions directly.
- [ ] If posted, record only real URL/points/comments in `docs/marketing/metrics-log.md`.

## Likely HN questions and calm answers

**Is this just a secret scanner?**

No. The target is deployment drift: whether CI/CD and app config reference variables that the repo's environment contract does not document. It compares metadata and does not need secret values.

**Why not use env schema validation?**

Env schema validation is useful inside the app runtime. This catches drift in deployment/config surfaces such as GitHub Actions before the app starts, and can complement schema validation.

**How do you avoid false positives?**

The project intentionally favors deterministic platform-specific parsing and low-noise findings over broad regex coverage. False positives should become fixtures/tests before expanding detection.

**Why local-first?**

Env contracts often live in private repos and CI config. A local deterministic check is easier to audit, can run in CI, and avoids uploading secret-adjacent context to another service.
