# Medium publish packet — AI agents are making deployment drift easier to create

Status: approval-gated. Do not publish until Darius explicitly approves this Medium text.
Target channel: Medium (`https://medium.com/@dardar.hermes`)
Source draft: `docs/marketing/medium-ai-agents-deployment-drift-draft.md`

## Recommendation

Publish this as the next Medium-native article only after Darius approves the exact draft. It should be treated as a secondary-channel narrative piece, not a duplicate repost of the Dev.to launch article.

Why Medium fits this piece:

- broader founder/engineering narrative than the first Dev.to post;
- frames deployment drift as an AI-agent workflow safety problem;
- still includes concrete CI/Docker examples and links to GitHub/npm;
- avoids over-claiming traction or adoption.

## Approval options

### Option A — approve as-is

Publish the draft in `docs/marketing/medium-ai-agents-deployment-drift-draft.md` with:

- title: `AI agents are making deployment drift easier to create`
- canonical links near the end:
  - `https://github.com/leviro-ai/secret-coverage`
  - `https://www.npmjs.com/package/@leviro-ai/secret-coverage`
- no paid promotion, no paid Medium plan, no newsletter import, and no duplicate Dev.to reposting.

### Option B — approve with a stronger founder note

Add a short first-person note before the final checklist:

> I started noticing this while reviewing AI-assisted changes: the code diff looked reasonable, but the deployment assumptions were spread across CI, Docker, env templates, and platform config. Secret Coverage is my attempt to make that hidden contract visible before deploy time.

This makes the piece more personal and Medium-native, while still staying technical.

### Option C — hold Medium and use X/Twitter first

Do not publish Medium yet. If Darius wants a lighter public touch first, use the already drafted X/Twitter cooldown thread in `docs/marketing/x-twitter-github-actions-missing-secret-thread.md` after re-verifying the GitHub Actions demo.

## Paste-ready front matter / setup

Medium does not require Markdown front matter, but the editor should use:

- Title: `AI agents are making deployment drift easier to create`
- Subtitle/deck option: `AI coding agents change application code quickly. The hidden env contracts around CI, Docker, and deployment config drift just as quickly.`
- Tags/topics to consider: `Software Development`, `DevOps`, `AI Coding`, `CI/CD`, `Developer Tools`

## Pre-publish checks

Run these immediately before publishing:

```bash
pnpm test tests/docs-examples.test.ts
pnpm scan -- --path examples/demos/github-actions-missing-secret --ci
pnpm scan -- --path examples/demos/docker-compose-missing-redis-url --ci
npm view @leviro-ai/secret-coverage version --json
```

Expected scan behavior:

- GitHub Actions demo exits `1` because `STRIPE_SECRET_KEY` is missing from the env template.
- Docker Compose demo exits `1` because `REDIS_URL` is missing from the env template.
- Neither output should print raw secret values.

## Risk notes

- Do not claim Medium readership, followers, users, stars, testimonials, or external validation.
- Do not frame Secret Coverage as a security scanner, secrets manager, or dotenv helper.
- Do not make the article a duplicate Dev.to repost.
- Do not publish without Darius approval, even though the Medium account is logged in.
- If published, record the final Medium URL and visible starting metrics in `docs/marketing/metrics-log.md`.

## Post-publish follow-up

If Darius approves and the article is published:

1. Save the public Medium URL.
2. Record initial visible metrics in `docs/marketing/metrics-log.md`.
3. Send the full public URL in the Slack update.
4. Monitor genuine responses; answer comments in Medium-native style only when useful.
5. Avoid cross-posting identical copy to Reddit/HN/X.
