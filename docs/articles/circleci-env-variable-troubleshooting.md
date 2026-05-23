# CircleCI environment variable troubleshooting

A CircleCI deploy job can pass code review and still fail when the workflow reaches a shell step that expects an environment variable nobody documented in the repo. The deployment config changed, but the env template did not.

Secret Coverage catches that deployment drift as metadata before the first signal is a failed CircleCI job or a deploy step that cannot authenticate.

## Quick symptom checklist

Use this checklist when a CircleCI workflow starts failing after CI, deploy, or AI-generated PR changes:

- `.circleci/config.yml` references `$SOME_KEY` or `${SOME_KEY}` inside a `run` command;
- `.env.example` or `.env.dist` does not include `SOME_KEY=`;
- the variable may exist in a CircleCI project context, but reviewers cannot see the required name in the repo contract;
- local builds work because the value exists in a developer shell or local env file;
- the deploy job fails only when CircleCI reaches the missing environment reference.

The safe fix is to document the required variable name in the env template and configure the real value in CircleCI, without copying secret values into git.

## Minimal example

This repository includes a small fixture at:

```txt
examples/demos/circleci-missing-deploy-key/
├── .circleci/config.yml
└── .env.example
```

The CircleCI deploy job logs in to a container registry with `DEPLOY_KEY`:

```yaml
version: 2.1

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

But the env template documents only:

```dotenv
NODE_ENV=production
DOCKER_IMAGE=ghcr.io/example/api
```

That means `DEPLOY_KEY` is required by the deploy workflow, but missing from the repo-visible environment contract.

## Reproduce the check

From the Secret Coverage repo root:

```bash
pnpm scan -- --path examples/demos/circleci-missing-deploy-key --ci
```

Expected result: the command exits non-zero because `.circleci/config.yml` references `DEPLOY_KEY` and the env template does not document it.

## What the report tells you

The important finding is metadata-only:

```md
- **DEPLOY_KEY** — DEPLOY_KEY is used in .circleci/config.yml but missing from an env template.
  - Context: `.circleci/config.yml` · `missing-from-template`
  - Fix: Add DEPLOY_KEY= to an env template and configure the value in your deployment environment.
```

Secret Coverage reports the variable name, file path, finding type, and recommended fix. It does not need to print or collect the deploy key value.

## Safe fix pattern

1. Add the missing variable name to the env template:

   ```dotenv
   NODE_ENV=production
   DOCKER_IMAGE=ghcr.io/example/api
   DEPLOY_KEY=
   ```

2. Configure the real secret value in CircleCI Project Settings or the appropriate CircleCI context.
3. Re-run the metadata check before merging deployment changes:

   ```bash
   pnpm scan -- --ci
   ```

4. Review whether the variable is required for every deploy workflow or only for a specific branch/environment.

## PR review questions

For CircleCI deployment changes, reviewers can ask:

- Did this PR add a new `.circleci/config.yml` shell reference like `$DEPLOY_KEY`?
- Is the variable documented in `.env.example` or `.env.dist`?
- Is the value configured in CircleCI project settings or the intended context?
- Does CI fail before deploy when the environment contract is incomplete?
- Are docs and reports limited to variable names and metadata, not raw secret values?

## Why this prevents repeated CI deploy failures

One missing CircleCI variable is easy to patch after a failed job. The recurring problem is that required deployment names drift away from the repo-visible contract. Secret Coverage makes that drift visible during review, so the fix is small: update the template, configure CircleCI, and keep secret values out of reports.

Related assets:

- [CircleCI missing deploy key demo](circleci-missing-deploy-key.md)
- [CI/CD environment variable validation checklist](ci-cd-env-validation-checklist.md)
- [AI-agent PR environment review walkthrough](ai-agent-pr-env-review-walkthrough.md)
