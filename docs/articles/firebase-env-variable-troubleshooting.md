# Firebase environment variable troubleshooting before deploy

Firebase makes it easy to ship web apps, Cloud Functions, scheduled jobs, and hosting rewrites quickly. Deployments can still fail when the repository contract drifts away from the environment variables Firebase Functions, Hosting builds, emulators, or CI deploy steps expect.

That is deployment drift. The value may exist in a Google Cloud Secret Manager secret, a Firebase runtime secret, a local shell, or one developer's machine, but the repo no longer documents the variable name required before deploy.

## Symptom

A Firebase deploy, function cold start, emulator run, hosting build, or CI release job fails with errors like:

- `Missing required environment variable: STRIPE_SECRET_KEY`
- `FIREBASE_PROJECT_ID is not set`
- `GOOGLE_APPLICATION_CREDENTIALS must be configured`
- `SENDGRID_API_KEY is required`
- `NEXT_PUBLIC_FIREBASE_API_KEY is undefined`
- `firebase deploy --only functions` succeeds, but a function crashes on boot because `DATABASE_URL`, `WEBHOOK_SECRET`, or `SUPABASE_SERVICE_ROLE_KEY` is missing
- an AI-generated PR changes `firebase.json`, function code, deploy scripts, or hosting build commands but skips `.env.example` / `.env.dist`

The usual sequence is:

1. A PR adds a new env var to Functions code, Hosting build code, deploy scripts, emulator config, or CI workflows.
2. Someone sets the real value in Firebase, Google Cloud Secret Manager, CI secrets, or their local shell.
3. The repository env template is not updated.
4. A fresh clone, preview deploy, emulator run, staging project, or production function discovers the missing contract late.

## Quick local check

Run Secret Coverage against the env template that represents your repository contract:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path . --env-template .env.example
```

If your team uses `.env.dist`:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path . --env-template .env.dist
```

To fail CI before a Firebase deploy starts:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path . --env-template .env.example --ci
```

Secret Coverage checks variable names, file paths, references, and template coverage as metadata-only deployment readiness signals. It does not need Firebase credentials, Google Cloud tokens, service-account JSON, project settings, deployed function config, or secret values.

## What to look for

Treat these as Firebase deployment-readiness risks:

- Functions code references `process.env.STRIPE_SECRET_KEY`, `process.env.SENDGRID_API_KEY`, `process.env.WEBHOOK_SECRET`, or `process.env.DATABASE_URL`, but `.env.example` / `.env.dist` is stale;
- Hosting or framework build code references `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, or similar public config without documenting the expected names;
- `firebase.json`, deploy scripts, emulator scripts, Dockerfile build steps, or CI workflows interpolate `$VAR` / `${VAR}` values;
- staging and production Firebase projects have different manually configured secrets, but no checked-in template tells reviewers what variable names must exist;
- AI-generated deployment changes add a function, scheduled job, hosting rewrite, framework build, or emulator target without updating the env template.

A common Firebase-style drift example:

```json
{
  "scripts": {
    "build": "next build",
    "deploy:functions": "firebase deploy --only functions"
  }
}
```

And a function expects:

```ts
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const sendgridApiKey = process.env.SENDGRID_API_KEY;
const databaseUrl = process.env.DATABASE_URL;
```

While the web app expects:

```ts
const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
```

But the repository template only says:

```dotenv
NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-project
DATABASE_URL=
```

That means the Firebase deploy path has undocumented requirements: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SENDGRID_API_KEY`, and `NEXT_PUBLIC_FIREBASE_API_KEY`.

## Minimal fix

Update the repository contract first:

```dotenv
NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-project
NEXT_PUBLIC_FIREBASE_API_KEY=
DATABASE_URL=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
SENDGRID_API_KEY=
```

Then configure actual values in the systems that own them: Firebase runtime secrets, Google Cloud Secret Manager, CI secrets used by `firebase deploy`, staging/production Firebase projects, local emulator `.env` files, and framework hosting build environments.

For monorepos, scan the app or functions directory that owns the Firebase deployment:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path apps/firebase-app --env-template .env.example --ci
```

## Firebase review checklist

Before merging a Firebase-related deployment PR, ask:

1. Did the PR add any new `process.env.X`, `$X`, `${X}`, framework public env var, function secret, emulator variable, deploy-script variable, or CI secret reference?
2. Does `.env.example` or `.env.dist` document the required variable name without committing the real value?
3. Are secret values stored in Firebase/Google Cloud/CI secret stores rather than copied into repo files?
4. Will local emulators, staging projects, production projects, scheduled functions, and hosting builds share the same documented env contract where they should?
5. Are Firebase project IDs, hosting targets, service-account files, emulator ports, regions, and rewrite rules documented separately from the variable-name contract?

Secret Coverage helps with the env-contract drift part. It does not validate Firebase project existence, IAM permissions, service-account scopes, deployed function health, hosting rewrites, emulator behavior, Google Cloud Secret Manager state, or whether the deployed value is correct.

## Notes and limits

- Secret Coverage does not call Firebase or Google Cloud APIs.
- It does not read Firebase project settings, runtime secrets, Google Cloud Secret Manager values, service-account JSON, deployed function config, logs, or secret values.
- It does not replace `firebase deploy`, emulator tests, function smoke tests, IAM review, secret rotation, or incident monitoring.
- It checks whether environment variables referenced by your repo are documented in the repo's env contract.

For broader review guidance, see the [CI/CD environment variable validation checklist](ci-cd-env-validation-checklist.md) and the [articles and demo index](README.md).
