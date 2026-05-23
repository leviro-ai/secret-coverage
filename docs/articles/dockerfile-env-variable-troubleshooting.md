# Dockerfile environment variable troubleshooting before deploy

Dockerfile failures around missing environment variables usually happen when a build arg or runtime `ENV` reference becomes a deployment requirement, but the repository template does not document it.

That is deployment drift. A Dockerfile, build command, CI workflow, or app startup path changed, but `.env.example` or `.env.dist` did not.

## Symptom

Use this checklist when Docker builds or container startups behave differently across local machines, CI, preview apps, or production:

- `docker build` works locally but fails in CI because a build argument is missing;
- the image builds, but the container exits at startup with `X is required`;
- a Dockerfile references `$SOME_VAR` or `${SOME_VAR}` that is not documented in the env template;
- CI passes a variable into `docker build --build-arg`, but reviewers cannot see it in `.env.example`;
- an AI-generated PR adds a Dockerfile stage, release command, or runtime env assumption without updating the repo contract.

The safe fix is not to commit real secret values. The safe fix is to document the variable name in the repo-visible env template and configure the real value in the environment that builds or runs the container.

## Minimal example

A Dockerfile might introduce a build-time or runtime requirement:

```dockerfile
FROM node:20-alpine

ARG SENTRY_AUTH_TOKEN
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN if [ -z "$SENTRY_AUTH_TOKEN" ]; then echo "SENTRY_AUTH_TOKEN is required"; exit 1; fi
CMD ["node", "server.js"]
```

But the repository template might only include:

```dotenv
DATABASE_URL=
NODE_ENV=production
```

That means the container build and runtime contract is incomplete: `SENTRY_AUTH_TOKEN` and `NEXT_PUBLIC_API_URL` are referenced by deployment config, but reviewers and CI setup owners do not see them in the env template.

## Quick local check

Run Secret Coverage before opening or merging the PR:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path . --env-template .env.example
```

If your team uses `.env.dist`:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path . --env-template .env.dist
```

To fail CI on critical drift:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path . --env-template .env.example --ci
```

Secret Coverage reports variable names, files, finding types, and recommended fixes. It does not need Docker registry access, does not inspect container images, and does not print raw secret values.

## What to look for in Docker changes

Treat these as deployment-readiness risks:

- new `ARG X` or `$X` / `${X}` references in a Dockerfile;
- `RUN` commands that require a token, endpoint, or credentials at build time;
- runtime `ENV` assignments that mirror a variable expected from the deploy platform;
- CI workflows that pass `--build-arg X` but do not update `.env.example`;
- app code inside the image reading `process.env.X` while the env template is missing `X=`.

A useful PR review question is:

> If this container were built from a fresh clone and deployed to a new environment, would the repo tell the operator every variable name they need to configure?

## Minimal fix

Update the repository contract first:

```dotenv
DATABASE_URL=
NODE_ENV=production
NEXT_PUBLIC_API_URL=
SENTRY_AUTH_TOKEN=
```

Then configure real values only in the places that need them:

- CI variables for build-time secrets;
- deploy-platform env settings for runtime variables;
- local `.env` files for developer machines;
- preview/staging/production environments that run the container.

For monorepos, scan the deployed service directory if each service owns its own env contract:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path apps/web --env-template .env.example --ci
```

## Notes and limits

- Secret Coverage does not build the Docker image.
- It does not pull env values from a registry or deployment platform.
- It does not validate whether a configured value is correct.
- It helps catch repository/deployment drift before a Docker build, image startup, or CI deploy step discovers the missing variable.

Related assets:

- [Docker Compose environment variable troubleshooting](docker-compose-env-variable-troubleshooting.md)
- [CI/CD environment variable validation checklist](ci-cd-env-validation-checklist.md)
- [Env template vs secret manager](env-template-vs-secret-manager.md)
