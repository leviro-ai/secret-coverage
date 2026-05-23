# GitHub Actions missing secrets troubleshooting

When a GitHub Actions deploy fails because a secret is missing, the root cause is often not the secret value itself. It is usually a contract mismatch: the workflow references a variable that the repo's env template does not document.

Secret Coverage is designed to catch that deployment drift before the workflow becomes the first place you learn about it.

## Quick symptom checklist

Use this checklist when a GitHub Actions job suddenly fails after a workflow, deploy script, or AI-generated PR changed configuration:

- a workflow references `${{ secrets.SOME_KEY }}` or `${{ env.SOME_KEY }}`;
- `.env.example` or `.env.dist` does not include `SOME_KEY=`;
- local builds pass because the variable exists in a developer shell;
- the deployment job fails only in GitHub Actions;
- reviewers cannot tell whether the missing key is an actual deploy requirement or stale config.

The fix should start with the metadata contract, not with copying secret values into docs.

## Minimal example

This repository includes a small fixture at:

```txt
examples/demos/github-actions-missing-secret/
├── .env.example
└── .github/workflows/deploy.yml
```

The workflow requires a Stripe key:

```yaml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
```

But the env template documents only:

```dotenv
NEXT_PUBLIC_APP_URL=https://example.com
DATABASE_URL=
```

That means `STRIPE_SECRET_KEY` is a deployment requirement, but the repo contract does not tell reviewers or CI setup owners that it must exist.

## Reproduce the check

From the Secret Coverage repo root:

```bash
pnpm scan -- --path examples/demos/github-actions-missing-secret --ci
```

Expected result: the command exits non-zero because the workflow references `STRIPE_SECRET_KEY` and the env template does not document it.

## What the report tells you

The important finding is metadata-only:

```md
- **STRIPE_SECRET_KEY** — STRIPE_SECRET_KEY is used in .github/workflows/deploy.yml but missing from an env template.
  - Context: `.github/workflows/deploy.yml` · `missing-from-template`
  - Fix: Add STRIPE_SECRET_KEY= to an env template and configure the value in your deployment environment.
```

Secret Coverage reports the variable name, file path, finding type, and recommended fix. It does not need to print or collect the secret value.

## Safe fix pattern

1. Add the missing variable name to the env template:

   ```dotenv
   NEXT_PUBLIC_APP_URL=https://example.com
   DATABASE_URL=
   STRIPE_SECRET_KEY=
   ```

2. Configure the real secret value in GitHub Actions repository, environment, or organization secrets.
3. Re-run the metadata check in CI:

   ```bash
   pnpm scan -- --ci
   ```

4. Review whether the workflow should fail on critical findings before deploy.

## PR review questions

For AI-generated PRs or config-heavy deployment changes, reviewers can ask:

- Did this PR add a new `${{ secrets.* }}` or `${{ env.* }}` reference?
- Is the variable documented in `.env.example` or `.env.dist`?
- Is the variable required for every environment, or only production?
- Does the workflow fail before deploy if the contract is incomplete?
- Are we documenting only variable names and metadata, not raw secret values?

## Why this prevents repeated deploy failures

A single missing GitHub Actions secret is easy to patch once. The recurring problem is that deployment requirements drift away from the repo-visible contract. Secret Coverage makes that drift visible in review and CI, so the fix is small: update the template, configure the deployment environment, and keep secret values out of reports.

Related assets:

- [GitHub Actions missing secret demo](github-actions-missing-secret.md)
- [CI/CD environment variable validation checklist](ci-cd-env-validation-checklist.md)
- [AI-agent PR environment review walkthrough](ai-agent-pr-env-review-walkthrough.md)
