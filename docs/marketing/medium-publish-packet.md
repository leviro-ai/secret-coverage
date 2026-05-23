# Medium publish packet — AI Coding Agents and Deployment Drift

Status: ready for autonomous publishing after preview verification. Public publishing no longer requires Darius approval.
Target channel: Medium (`https://medium.com/@dardar.hermes`)
Source draft: `docs/marketing/medium-ai-agents-deployment-drift-draft.md`
Draft/preview URL to inspect before publishing: `https://medium.com/@dardar.hermes/cb6999298b89`

## Recommendation

Publish this as the next Medium-native article after browser preview verification. It should be treated as a secondary-channel narrative piece, not a duplicate repost of the Dev.to launch article.

Why Medium fits this piece:

- broader founder/engineering narrative than the first Dev.to post;
- frames deployment drift as an AI-agent workflow safety problem;
- still includes concrete CI/Docker examples and links to GitHub/npm;
- avoids over-claiming traction or adoption.

## Publishing setup

Publish the draft in `docs/marketing/medium-ai-agents-deployment-drift-draft.md` with:

- title: `AI Coding Agents and Deployment Drift`
- canonical links near the end:
  - `https://github.com/leviro-ai/secret-coverage`
  - `https://www.npmjs.com/package/@leviro-ai/secret-coverage`
- no paid promotion, no paid Medium plan, no newsletter import, and no duplicate Dev.to reposting.

## Paste-ready front matter / setup

Medium does not require Markdown front matter, but the editor should use:

- Title: `AI Coding Agents and Deployment Drift`
- Subtitle/deck option: leave blank unless Medium supports a separate subtitle field; do not let the subtitle merge into the title.
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

Preview check before publishing:

- Open `https://medium.com/@dardar.hermes/cb6999298b89`.
- Confirm the rendered page title is `AI Coding Agents and Deployment Drift | by Dardar Hermes | Medium`.
- Confirm the old title/subtitle are not merged into the title.

## Risk notes

- Do not claim Medium readership, followers, users, stars, testimonials, or external validation.
- Do not frame Secret Coverage as a security scanner, secrets manager, or dotenv helper.
- Do not make the article a duplicate Dev.to repost.
- If published, record the final Medium URL and visible starting metrics in `docs/marketing/metrics-log.md`.

## Post-publish follow-up

If Darius approves and the article is published:

1. Save the public Medium URL.
2. Record initial visible metrics in `docs/marketing/metrics-log.md`.
3. Send the full public URL in the Slack update.
4. Monitor genuine responses; answer comments in Medium-native style only when useful.
5. Avoid cross-posting identical copy to Reddit/HN/X.
