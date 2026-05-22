# GitHub Actions missing secret demo

This fixture intentionally models a small deployment drift bug:

- `.github/workflows/deploy.yml` references `STRIPE_SECRET_KEY` as a GitHub Actions secret.
- `.env.example` does not document `STRIPE_SECRET_KEY`.
- Secret Coverage should report the missing environment contract before deploy time.

Run from the repository root:

```bash
pnpm scan -- --path examples/demos/github-actions-missing-secret --ci
```

Expected result: the command exits non-zero because a critical CI/CD environment reference is missing from the declared env template.
