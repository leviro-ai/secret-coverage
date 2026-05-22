# CircleCI missing deploy key demo

This fixture intentionally models a common CI/CD deployment drift bug:

- `.circleci/config.yml` uses `DEPLOY_KEY` during a registry login step.
- `.env.example` documents `NODE_ENV` and `DOCKER_IMAGE`, but not `DEPLOY_KEY`.
- Secret Coverage should report the missing environment contract before the CircleCI deploy job becomes the first signal.

Run from the repository root:

```bash
pnpm scan -- --path examples/demos/circleci-missing-deploy-key --ci
```

Expected result: the command exits non-zero because a CircleCI environment reference is missing from the declared env template.
