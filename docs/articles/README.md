# Secret Coverage articles and demo index

This directory collects concrete, non-hype examples for deployment drift detection and CI/CD environment validation. Each page is designed to be useful on its own: run the fixture, inspect screenshot-ready output, and adapt the checklist to your own deployment workflow.

## Start here

- [CI/CD environment variable validation checklist](ci-cd-env-validation-checklist.md) — a practical checklist for reviewing env templates, deployment config, and CI checks before merge.
- [AI-agent PR environment review walkthrough](ai-agent-pr-env-review-walkthrough.md) — how to review AI-generated PRs for deployment-breaking environment drift.
- [Preview environment variable checklist](preview-environment-variable-checklist.md) — how to review preview deploy, worker, migration, and webhook env drift before merge.
- [Monorepo env validation with `--path`](monorepo-env-validation-with-path.md) — how to roll out env drift checks one deployable app at a time.
- [Staging vs production env drift checklist](staging-production-env-drift-checklist.md) — how to compare environment contracts safely without exposing raw secret values.
- [Env template vs secret manager](env-template-vs-secret-manager.md) — where deployment drift hides when real values are stored correctly but the repo contract is incomplete.

## Concrete demo walkthroughs

These pages pair with runnable fixtures under `examples/demos/` and screenshot-ready `secret-coverage-output.md` files.

| Platform | Demo article | Fixture | Drift caught |
| --- | --- | --- | --- |
| GitHub Actions | [Catch a missing GitHub Actions secret before deploy](github-actions-missing-secret.md) | [`examples/demos/github-actions-missing-secret/`](../../examples/demos/github-actions-missing-secret/) | `STRIPE_SECRET_KEY` referenced by workflow but missing from `.env.example` |
| Docker Compose | [Catch a missing Redis URL in Docker Compose before deploy](docker-compose-missing-redis-url.md) | [`examples/demos/docker-compose-missing-redis-url/`](../../examples/demos/docker-compose-missing-redis-url/) | `REDIS_URL` referenced by services but missing from `.env.example` |
| Vercel | [Catch a missing Supabase service key in Vercel config before deploy](vercel-missing-supabase-key.md) | [`examples/demos/vercel-missing-supabase-key/`](../../examples/demos/vercel-missing-supabase-key/) | `SUPABASE_SERVICE_ROLE_KEY` referenced by `vercel.json` but missing from `.env.example` |
| CircleCI | [Catch a missing deploy key in CircleCI before a release job fails](circleci-missing-deploy-key.md) | [`examples/demos/circleci-missing-deploy-key/`](../../examples/demos/circleci-missing-deploy-key/) | `DEPLOY_KEY` referenced by deploy job but missing from `.env.example` |
| GitLab CI | [GitLab CI deploy fails because a token was never documented](gitlab-ci-missing-deploy-token.md) | [`examples/demos/gitlab-ci-missing-deploy-token/`](../../examples/demos/gitlab-ci-missing-deploy-token/) | `DEPLOY_TOKEN` referenced by deploy job but missing from `.env.example` |
| Next.js | [Next.js checkout deploy fails because a server secret was never documented](nextjs-missing-stripe-secret.md) | [`examples/demos/nextjs-missing-stripe-secret/`](../../examples/demos/nextjs-missing-stripe-secret/) | `STRIPE_SECRET_KEY` referenced by an API route but missing from `.env.example` |

## Troubleshooting pages

These are long-tail support assets for developers who already know the symptom and need a safe debugging path.

- [Deployment failed because an environment variable was missing](deployment-failed-missing-env-variable.md)
- [Preview environment variable checklist](preview-environment-variable-checklist.md)
- [Monorepo env validation with `--path`](monorepo-env-validation-with-path.md)
- [Staging vs production env drift checklist](staging-production-env-drift-checklist.md)
- [Env template vs secret manager](env-template-vs-secret-manager.md)
- [GitHub Actions missing-secrets troubleshooting](github-actions-missing-secrets-troubleshooting.md)
- [Dockerfile environment variable troubleshooting](dockerfile-env-variable-troubleshooting.md)
- [Docker Compose environment variable troubleshooting](docker-compose-env-variable-troubleshooting.md)
- [Vercel environment variable troubleshooting](vercel-env-variable-troubleshooting.md)
- [CircleCI environment variable troubleshooting](circleci-env-variable-troubleshooting.md)
- [Next.js missing Stripe secret walkthrough](nextjs-missing-stripe-secret.md)
- [Railway environment variable troubleshooting](railway-env-variable-troubleshooting.md)
- [Render environment variable troubleshooting](render-env-variable-troubleshooting.md)
- [Netlify environment variable troubleshooting](netlify-env-variable-troubleshooting.md)
- [Heroku environment variable troubleshooting](heroku-env-variable-troubleshooting.md)
- [DigitalOcean App Platform environment variable troubleshooting](digitalocean-app-platform-env-variable-troubleshooting.md)
- [Supabase environment variable troubleshooting](supabase-env-variable-troubleshooting.md)
- [Terraform environment variable troubleshooting](terraform-env-variable-troubleshooting.md)
- [Kubernetes environment variable troubleshooting](kubernetes-env-variable-troubleshooting.md)
- [AWS Secrets Manager environment variable troubleshooting](aws-secrets-manager-env-variable-troubleshooting.md)
- [Azure Key Vault environment variable troubleshooting](azure-key-vault-env-variable-troubleshooting.md)
- [HashiCorp Vault environment variable troubleshooting](hashicorp-vault-env-variable-troubleshooting.md)
- [Jenkins environment variable troubleshooting](jenkins-env-variable-troubleshooting.md)
- [Coolify environment variable troubleshooting](coolify-env-variable-troubleshooting.md)
- [Fly.io environment variable troubleshooting](flyio-env-variable-troubleshooting.md)
- [Firebase environment variable troubleshooting](firebase-env-variable-troubleshooting.md)
- [CapRover environment variable troubleshooting](caprover-env-variable-troubleshooting.md)

## External writeups

These user-facing docs are the source of truth. Related external articles may adapt the same examples for specific platforms, but the runnable fixtures and maintenance notes live here.

Do not fake engagement, comments, stars, testimonials, users, or reviews. Treat these assets as concrete technical material, not traction claims.
