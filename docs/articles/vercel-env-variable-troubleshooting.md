# Vercel environment variable troubleshooting

A Vercel preview or production deployment can fail even when the code looked fine in review. The common cause is deployment drift: `vercel.json`, Next.js config, or server code now expects an environment variable that the repo's env template does not document.

Secret Coverage catches that mismatch as metadata before the first signal is a broken preview deploy or a runtime path that cannot reach an external service.

## Quick symptom checklist

Use this checklist when a Vercel deployment starts failing after config, deployment, or AI-generated PR changes:

- `vercel.json` references `$SOME_KEY` in `env`, `build.env`, or related deployment config;
- `.env.example` or `.env.dist` does not include `SOME_KEY=`;
- a local build works because the variable exists in a developer shell or local env file;
- preview deploys fail only after Vercel evaluates the missing value;
- reviewers cannot tell whether the variable is a required deployment contract or stale config.

The safe fix starts by documenting the variable name in the repo contract, not by copying secret values into docs.

## Minimal example

This repository includes a small fixture at:

```txt
examples/demos/vercel-missing-supabase-key/
├── .env.example
└── vercel.json
```

The Vercel config expects a Supabase service role key:

```json
{
  "buildCommand": "pnpm build",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_SITE_URL": "$NEXT_PUBLIC_SITE_URL",
    "SUPABASE_SERVICE_ROLE_KEY": "$SUPABASE_SERVICE_ROLE_KEY"
  }
}
```

But the env template documents only:

```dotenv
NEXT_PUBLIC_SITE_URL=
```

That means `SUPABASE_SERVICE_ROLE_KEY` is required by deployment config, but missing from the repo-visible environment contract.

## Reproduce the check

From the Secret Coverage repo root:

```bash
pnpm scan -- --path examples/demos/vercel-missing-supabase-key --ci
```

Expected result: the command exits non-zero because `vercel.json` references `SUPABASE_SERVICE_ROLE_KEY` and the env template does not document it.

## What the report tells you

The important finding is metadata-only:

```md
- **SUPABASE_SERVICE_ROLE_KEY** — SUPABASE_SERVICE_ROLE_KEY is used in vercel.json but missing from an env template.
  - Context: `vercel.json` · `missing-from-template`
  - Fix: Add SUPABASE_SERVICE_ROLE_KEY= to an env template and configure the value in your deployment environment.
```

Secret Coverage reports the variable name, file path, finding type, and recommended fix. It does not need to print or collect the Supabase key value.

## Safe fix pattern

1. Add the missing variable name to the env template:

   ```dotenv
   NEXT_PUBLIC_SITE_URL=
   SUPABASE_SERVICE_ROLE_KEY=
   ```

2. Configure the real secret value in Vercel Project Settings → Environment Variables for the correct environments.
3. Re-run the metadata check before deploy:

   ```bash
   pnpm scan -- --ci
   ```

4. Review whether the key should exist in preview, production, or both. The template should describe required names; Vercel should hold the actual values.

## PR review questions

For Vercel and Next.js changes, reviewers can ask:

- Did this PR add a new `vercel.json` env reference or server-side `process.env.*` dependency?
- Is the variable documented in `.env.example` or `.env.dist`?
- Is the value needed for preview deployments, production deployments, or local development only?
- Does CI fail before deploy when the environment contract is incomplete?
- Are docs and reports limited to variable names and metadata, not raw secret values?

## Why this prevents repeated preview-deploy failures

One missing Vercel variable is easy to patch after a failed deploy. The recurring problem is that environment requirements drift away from the repo-visible contract. Secret Coverage makes that drift visible during review, so the fix is small: update the template, configure Vercel, and keep secret values out of reports.

Related assets:

- [Vercel missing Supabase service key demo](vercel-missing-supabase-key.md)
- [CI/CD environment variable validation checklist](ci-cd-env-validation-checklist.md)
- [AI-agent PR environment review walkthrough](ai-agent-pr-env-review-walkthrough.md)
