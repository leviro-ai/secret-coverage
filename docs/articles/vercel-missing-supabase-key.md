# Catch a missing Supabase service key in Vercel config before deploy

Vercel projects can drift when app code or deployment config starts expecting a server-side key, but the repository's env template is not updated for the next developer, reviewer, or AI coding agent.

Secret Coverage is meant to catch that contract mismatch before the first signal is a broken preview deploy or a runtime path that cannot reach Supabase.

## Demo fixture

This repo includes a minimal fixture at:

```txt
examples/demos/vercel-missing-supabase-key/
├── .env.example
└── vercel.json
```

The Vercel config references `SUPABASE_SERVICE_ROLE_KEY`:

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

But `.env.example` intentionally documents only:

```dotenv
NEXT_PUBLIC_SITE_URL=
```

That means `SUPABASE_SERVICE_ROLE_KEY` is required by the deployment config, but missing from the declared env contract.

## Run the check

From the Secret Coverage repository root:

```bash
pnpm scan -- --path examples/demos/vercel-missing-supabase-key --ci
```

## Screenshot-ready output

```md
# Secret Coverage Report

Readiness score: **73/100**

Critical: 1 · Warning: 0 · Info: 1

## Critical

- **SUPABASE_SERVICE_ROLE_KEY** — SUPABASE_SERVICE_ROLE_KEY is used in vercel.json but missing from an env template.
  - Context: `vercel.json` · `missing-from-template`
  - Fix: Add SUPABASE_SERVICE_ROLE_KEY= to an env template and configure the value in your deployment environment.
```

## Why this matters

This is a metadata-only deployment readiness check. Secret Coverage does not need the Supabase key value. It only checks which environment variables are documented, which ones deployment/config files reference, and whether the declared contract is complete.

That makes the check useful for:

- Vercel preview/deployment readiness;
- PR review of AI-generated Next.js and Supabase config changes;
- catching environment drift before a failed deploy or runtime incident;
- keeping `.env.example` or `.env.dist` aligned with Vercel project requirements.

## Fix

Add the missing key to the env template and configure the real value in Vercel's project environment settings:

```dotenv
NEXT_PUBLIC_SITE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Then rerun:

```bash
pnpm scan -- --path examples/demos/vercel-missing-supabase-key --ci
```

The goal is not to expose secret values. The goal is to catch missing deployment assumptions while the fix is still small.
