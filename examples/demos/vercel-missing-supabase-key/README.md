# Vercel missing Supabase key demo

This fixture intentionally models a common deployment drift bug in Vercel-hosted Next.js apps:

- `vercel.json` references `SUPABASE_SERVICE_ROLE_KEY` for server-side deployment/runtime config.
- `.env.example` documents `NEXT_PUBLIC_SITE_URL`, but not `SUPABASE_SERVICE_ROLE_KEY`.
- Secret Coverage should report the missing environment contract before Vercel build/runtime behavior becomes the first signal.

Run from the repository root:

```bash
pnpm scan -- --path examples/demos/vercel-missing-supabase-key --ci
```

Expected result: the command exits non-zero because a Vercel environment reference is missing from the declared env template.
