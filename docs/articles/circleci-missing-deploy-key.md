# Catch a missing deploy key in CircleCI before a release job fails

CircleCI pipelines can drift when a deployment command starts depending on a new environment variable, but the repository's env template does not document it for reviewers, future maintainers, or AI coding agents.

Secret Coverage is meant to catch that contract mismatch before the first signal is a failed release job.

## Demo fixture

This repo includes a minimal fixture at:

```txt
examples/demos/circleci-missing-deploy-key/
├── .env.example
└── .circleci/config.yml
```

The CircleCI config references `DEPLOY_KEY` in a deployment step:

```yaml
jobs:
  deploy:
    docker:
      - image: cimg/node:20.11
    environment:
      NODE_ENV: production
      DOCKER_IMAGE: ghcr.io/example/api
    steps:
      - checkout
      - run:
          name: Build and push image
          command: |
            pnpm install --frozen-lockfile
            pnpm build
            docker login ghcr.io -u deploy-bot -p "$DEPLOY_KEY"
            docker push "$DOCKER_IMAGE:latest"
```

But `.env.example` intentionally documents only:

```dotenv
NODE_ENV=production
DOCKER_IMAGE=ghcr.io/example/api
```

That means `DEPLOY_KEY` is required by the release job, but missing from the declared env contract.

## Run the check

From the Secret Coverage repository root:

```bash
pnpm scan -- --path examples/demos/circleci-missing-deploy-key --ci
```

## Screenshot-ready output

```md
# Secret Coverage Report

Readiness score: **75/100**

Critical: 1 · Warning: 0 · Info: 0

## Critical

- **DEPLOY_KEY** — DEPLOY_KEY is used in .circleci/config.yml but missing from an env template.
  - Context: `.circleci/config.yml` · `missing-from-template`
  - Fix: Add DEPLOY_KEY= to an env template and configure the value in your deployment environment.
```

## Why this matters

This is a metadata-only deployment readiness check. Secret Coverage does not need the deploy key value. It only checks which environment variables are documented, which ones CI/CD files reference, and whether the declared contract is complete.

That makes the check useful for:

- CircleCI deployment readiness;
- PR review of CI/CD release changes;
- catching environment drift before a failed deploy job;
- keeping `.env.example` or `.env.dist` aligned with release requirements.

## Fix

Add the missing key to the env template and configure the real value in CircleCI project or context environment settings:

```dotenv
NODE_ENV=production
DOCKER_IMAGE=ghcr.io/example/api
DEPLOY_KEY=
```

Then rerun:

```bash
pnpm scan -- --path examples/demos/circleci-missing-deploy-key --ci
```

The goal is not to expose secret values. The goal is to catch missing deployment assumptions while the fix is still small.
