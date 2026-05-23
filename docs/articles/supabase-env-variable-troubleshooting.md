# Supabase environment variable troubleshooting before deploy

Supabase-backed apps often fail for a boring reason: code starts using a new Supabase URL, anon key, service-role key, JWT secret, or database URL, but the repository template still does not document that requirement.

That is deployment drift. The deployment environment may have a value somewhere, but the repo contract no longer tells reviewers, CI, previews, or teammates what the app needs.

## Symptom

A Supabase integration works locally or in one environment, then fails in CI, preview, staging, or production with errors like:

- `Missing NEXT_PUBLIC_SUPABASE_URL`
- `Missing NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY is required`
- `DATABASE_URL must be set`
- migrations or seed jobs fail because the database URL was never documented
- a server route works in production but fails in preview because only one environment was manually updated

The usual sequence is:

1. A PR adds a Supabase client, admin route, migration job, webhook handler, or AI-generated config change.
2. The new code references another environment variable.
3. Someone adds the real value in one local or hosted environment.
4. `.env.example` or `.env.dist` is not updated.
5. The next deploy, preview, teammate setup, or CI job discovers the missing contract late.

## Quick local check

Run Secret Coverage against the env template that represents your repository contract:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path . --env-template .env.example
```

If your team uses `.env.dist`:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path . --env-template .env.dist
```

To make this a CI guardrail before deploy:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path . --env-template .env.example --ci
```

Secret Coverage checks variable names, file paths, references, and template coverage as metadata-only deployment readiness signals. It does not need Supabase credentials and does not print raw secret values.

## What to look for

Treat these as Supabase deployment-readiness risks:

- browser code references `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`, but the template does not include them;
- server code references `SUPABASE_SERVICE_ROLE_KEY`, but the variable is missing from `.env.example` / `.env.dist`;
- migration, seed, or worker scripts reference `DATABASE_URL` without documenting it;
- CI/CD config references `$SUPABASE_ACCESS_TOKEN`, `$SUPABASE_PROJECT_REF`, or `$SUPABASE_DB_PASSWORD` without a template entry or review note;
- AI-generated PRs add Supabase helpers while skipping environment contract updates.

A common server-side example:

```ts
// src/lib/supabase-admin.ts
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Supabase admin env is incomplete");
}
```

But the repository template only says:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

That means the server/admin path has an undocumented deployment requirement: `SUPABASE_SERVICE_ROLE_KEY`.

## Minimal fix

Update the repository contract first:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Then configure the actual values in the environments that run the affected code path: local development, CI, preview, staging, production, worker jobs, or migration jobs.

For monorepos, scan the app or package that owns the Supabase integration:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path apps/web --env-template .env.example --ci
```

## CI/CD review checklist

Before merging a Supabase-related PR, ask:

1. Did the PR add any new `process.env.X`, `$X`, `${X}`, or CI secret references?
2. Are public browser variables (`NEXT_PUBLIC_*`) documented separately from server-only secrets?
3. Are service-role keys used only in server-side paths and never treated as client-side variables?
4. Do preview/staging/prod deployment environments all know about the new variable requirement?
5. Does the env template explain the deployment contract without committing actual secret values?

Secret Coverage helps with the contract drift part. It does not validate whether the value is correct, whether Supabase Row Level Security is configured correctly, or whether a service-role key is used safely in your app architecture.

## Notes and limits

- Secret Coverage does not pull project settings from Supabase.
- It does not use the Supabase Management API.
- It does not replace Supabase secrets, a vault, or a runtime environment loader.
- It checks whether variables referenced by your repo are documented in the repo's env contract.

For a concrete Supabase-flavored fixture, see the Vercel demo: [Catch a missing Supabase service key in Vercel config before deploy](vercel-missing-supabase-key.md). For more support assets, see the [articles and demo index](README.md).
