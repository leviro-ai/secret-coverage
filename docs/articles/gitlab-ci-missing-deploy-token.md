# GitLab CI deploy fails because a token was never documented

GitLab CI/CD pipelines often fail late when a deploy job references a variable that was never added to the repo's env contract. The code review sees a pipeline change, but the deployment environment is missing one required setting.

Secret Coverage treats this as deployment drift: the workflow references a variable, while `.env.example` or `.env.dist` does not document it.

## Minimal failing example

`.gitlab-ci.yml`:

```yaml
stages:
  - deploy

deploy_production:
  stage: deploy
  image: alpine:3.20
  script:
    - test -n "$DEPLOY_TOKEN"
    - echo "Deploying $NEXT_PUBLIC_APP_URL"
    - ./scripts/deploy.sh --token "$DEPLOY_TOKEN"
```

`.env.example`:

```dotenv
NEXT_PUBLIC_APP_URL=
```

`DEPLOY_TOKEN` is required by the deployment job, but the template only documents `NEXT_PUBLIC_APP_URL`.

## Detect it before merge

```bash
pnpm scan -- --path examples/demos/gitlab-ci-missing-deploy-token --ci
```

Expected finding:

```txt
DEPLOY_TOKEN is referenced in .gitlab-ci.yml but missing from the env template.
```

This is metadata-only: Secret Coverage reports variable names, files, finding types, and remediation guidance. It does not need the real deploy token.

## Safe fix

Add the variable name to the env template:

```dotenv
NEXT_PUBLIC_APP_URL=
DEPLOY_TOKEN=
```

Then configure the real value in GitLab CI/CD Variables. The template documents the deployment contract; GitLab stores the actual secret value.

## PR review checklist

- Did this PR change `.gitlab-ci.yml` or deploy scripts?
- Did it add a new `$VARIABLE` reference?
- Is the variable documented in `.env.example` or `.env.dist`?
- Is the real value configured in GitLab CI/CD Variables before merge?
- Does `pnpm scan -- --ci` fail only when required deployment metadata is missing?

Use this check when AI-generated PRs update deployment workflows. The failure mode is not that the code cannot compile — it is that the deployment contract drifted away from the environment that will run it.
