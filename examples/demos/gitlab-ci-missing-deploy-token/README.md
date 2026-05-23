# GitLab CI missing deploy token demo

This fixture shows a common deployment drift failure: `.gitlab-ci.yml` references `DEPLOY_TOKEN`, but the env template does not document it.

Run:

```bash
pnpm scan -- --path examples/demos/gitlab-ci-missing-deploy-token --ci
```

Expected result:

- Secret Coverage reports `DEPLOY_TOKEN` as `missing-from-template`.
- CI mode exits non-zero because the deploy job depends on an undocumented variable.
- No raw secret values are required or printed.

Safe fix:

```dotenv
DEPLOY_TOKEN=
```

Add the variable name to `.env.example`, then configure the real value in GitLab CI/CD Variables before merging the deployment change.
