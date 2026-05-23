# Secret Coverage — Deployment Drift Detection for Environment Variables

![CI](https://github.com/leviro-ai/secret-coverage/actions/workflows/test.yml/badge.svg)
![npm](https://img.shields.io/npm/v/%40leviro-ai%2Fsecret-coverage)
![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Local first](https://img.shields.io/badge/local--first-no_cloud_required-brightgreen)

> Detect missing environment variables before your deployment fails.

Secret Coverage is a local-first, metadata-only deployment readiness layer for modern CI/CD. It helps teams catch environment variable mismatch, missing GitHub Actions secrets, GitLab CI environment validation issues, Docker Compose env mismatch, Vercel environment drift, and broken deployment prevention problems before they reach production.

Secret Coverage is built for the AI coding era: AI-generated codebases increasingly change workflows, add configs, and introduce deployment assumptions faster than teams can manually review them. Secret Coverage gives developers deterministic CI/CD environment consistency checks without turning into a secrets manager.

## 1. Problem

Deployments break when environment assumptions drift:

- AI changes GitHub Actions, GitLab CI, or CircleCI workflows without updating `.env.example`.
- AI-generated PRs add new config paths but forget deployment variables.
- Vercel preview deployment environment mismatch goes unnoticed until deploy time.
- Docker Compose services reference variables that are not documented.
- Stage/prod drift accumulates until nobody knows which environment is deployment-ready.
- Missing secrets are discovered inside CI logs instead of during review.

Secret Coverage exists to detect missing environment variables before deploy, compare CI environment variable coverage, and reduce AI coding deployment failures.

## 2. What Secret Coverage does

Secret Coverage scans your repo and reports deployment readiness risks such as:

```txt
Critical:
NEXT_PUBLIC_API_URL is used in .github/workflows/deploy.yml but missing from .env.example.

Fix:
Add NEXT_PUBLIC_API_URL= to .env.example and configure the value in your deployment environment.
```

Practical checks include:

- variables referenced by CI/CD or deployment files but missing from `.env.example`;
- undocumented local variables that may become stale vars;
- likely plaintext secrets committed in local env files, without printing secret values;
- AI-generated workflow mistakes where a new pipeline references an undefined variable;
- deployment readiness score for fast PR review.

## 3. Supported Platforms — MVP supported

MVP implementation scope is intentionally narrow:

- `.env.example` and local `.env*` metadata checks
- GitHub Actions env validation
- GitLab CI/CD environment validation
- CircleCI environment validation
- Dockerfile and Docker Compose missing env detection
- Vercel detection heuristics

The codebase may contain early static heuristics for additional systems while they mature, but MVP support is the list above. API integrations are intentionally not part of the MVP.

## 4. Planned Integrations

Narrative scope is broader than MVP implementation scope. These integrations are planned for roadmap visibility, SEO/GEO/LLM discoverability, and future ecosystem ambition — not MVP complexity:

- Railway
- Render
- Supabase
- Terraform
- Kubernetes
- AWS Secrets Manager
- Azure Key Vault
- Hashicorp Vault
- Jenkins
- Coolify
- Fly.io
- Firebase
- CapRover deeper coverage
- Supabase API integrations
- Railway API integrations
- Render API integrations

See:

- [`docs/roadmap/strategic-roadmap.md`](docs/roadmap/strategic-roadmap.md)
- [`docs/integrations/planned-integrations.md`](docs/integrations/planned-integrations.md)

## 5. Example drift reports

### Stage/prod mismatch

```txt
Warning:
STRIPE_WEBHOOK_SECRET exists in production metadata but is missing from stage metadata.

Impact:
Stage cannot reliably test webhook deploys before production.

Fix:
Add STRIPE_WEBHOOK_SECRET to stage or document why stage intentionally differs.
```

### Undocumented variable

```txt
Critical:
NEXT_PUBLIC_API_URL is used in GitHub Actions but missing from .env.example.

Fix:
Add NEXT_PUBLIC_API_URL= to .env.example and configure it in the deployment environment.
```

### Stale variable

```txt
Warning:
LEGACY_PAYMENT_TOKEN exists in .env.local but is not referenced by supported project configs.

Fix:
Remove it if obsolete, or add it to .env.example if it is still required.
```

### AI-generated workflow mistake

```txt
Critical:
DEPLOY_API_TOKEN was introduced in .gitlab-ci.yml but is not documented in .env.example.

Fix:
Review the AI-generated PR, add DEPLOY_API_TOKEN= to .env.example, and configure the CI secret before merging.
```

## 6. Why this exists

Secret Coverage is not secret management.

It is deployment readiness visibility:

- deployment drift detection;
- CI/CD environment consistency;
- AI-generated deployment safety;
- broken deployment prevention;
- environment variable mismatch detection;
- metadata-only configuration observability.

Secret values must never leave your machine, CI runner, or GitHub Action environment. Secret Coverage reports variable names, existence, references, files, finding types, and recommendations — not raw secret values.

See [`docs/trust-security-architecture.md`](docs/trust-security-architecture.md).

## Install

```bash
pnpm add -D @leviro-ai/secret-coverage
npm install -D @leviro-ai/secret-coverage
```

Run without installing:

```bash
pnpm dlx @leviro-ai/secret-coverage scan
npx @leviro-ai/secret-coverage scan
```

## CLI usage

```bash
secret-coverage scan
secret-coverage scan --format markdown
secret-coverage scan --json
secret-coverage scan --ci
secret-coverage scan --strict
secret-coverage scan --path ./apps/web
secret-coverage scan --env-template config/env.template
```

Options:

| Option | Purpose |
| --- | --- |
| `--path <path>` | Scan a specific project directory. Defaults to current directory. |
| `--env-template <file>` | Use a specific env template file instead of auto-detecting `.env.example` / `.env.dist`. |
| `--format markdown` | Human-readable report. Default. |
| `--json` | Machine-readable JSON output. |
| `--ci` | Exit non-zero when critical findings exist. |
| `--strict` | Exit non-zero when critical or warning findings exist. |

Full sample reports:

- [`examples/sample-report.md`](examples/sample-report.md)
- [`examples/sample-report.json`](examples/sample-report.json)

Concrete demos and walkthroughs:

- [`docs/articles/`](docs/articles/) — index of runnable demos, support pages, and review walkthroughs.
- [`examples/demos/github-actions-missing-secret/`](examples/demos/github-actions-missing-secret/) — GitHub Actions references `STRIPE_SECRET_KEY` but the env template does not document it.
- [`examples/demos/docker-compose-missing-redis-url/`](examples/demos/docker-compose-missing-redis-url/) — Docker Compose references `REDIS_URL` but the env template does not document it.
- [`examples/demos/gitlab-ci-missing-deploy-token/`](examples/demos/gitlab-ci-missing-deploy-token/) — GitLab CI references `DEPLOY_TOKEN` but the env template does not document it.
- [`examples/demos/nextjs-missing-stripe-secret/`](examples/demos/nextjs-missing-stripe-secret/) — Next.js API route references `STRIPE_SECRET_KEY` but the env template does not document it.
- [`docs/articles/github-actions-missing-secrets-troubleshooting.md`](docs/articles/github-actions-missing-secrets-troubleshooting.md) — troubleshooting checklist for GitHub Actions missing-secret deployment failures.
- [`docs/articles/docker-compose-env-variable-troubleshooting.md`](docs/articles/docker-compose-env-variable-troubleshooting.md) — troubleshooting checklist for Docker Compose environment variable drift.
- [`docs/articles/gitlab-ci-missing-deploy-token.md`](docs/articles/gitlab-ci-missing-deploy-token.md) — troubleshooting walkthrough for GitLab CI deploy-token drift.
- [`docs/articles/nextjs-missing-stripe-secret.md`](docs/articles/nextjs-missing-stripe-secret.md) — troubleshooting walkthrough for Next.js server-secret drift.
- [`docs/articles/vercel-env-variable-troubleshooting.md`](docs/articles/vercel-env-variable-troubleshooting.md) — troubleshooting checklist for Vercel environment variable drift.
- [`docs/articles/circleci-env-variable-troubleshooting.md`](docs/articles/circleci-env-variable-troubleshooting.md) — troubleshooting checklist for CircleCI deploy-variable drift.
- [`docs/articles/ci-cd-env-validation-checklist.md`](docs/articles/ci-cd-env-validation-checklist.md) — practical CI/CD environment variable validation checklist.
- [`docs/articles/ai-agent-pr-env-review-walkthrough.md`](docs/articles/ai-agent-pr-env-review-walkthrough.md) — reviewing AI-generated PRs for deployment-breaking env drift.

## GitHub Action

The composite action runs the built CLI with `--ci`. Markdown output is printed in the job logs and also appended to the GitHub Actions step summary for quick PR review. `strict: 'false'` fails only on critical findings; `strict: 'true'` also fails on warnings.

```yaml
name: Secret Coverage

on:
  pull_request:
  push:
    branches: [main]

jobs:
  secret-coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: leviro-ai/secret-coverage@main
        with:
          strict: 'false'
          format: markdown
```

For stricter pull request checks:

```yaml
- uses: leviro-ai/secret-coverage@main
  with:
    strict: 'true'
```

## Design principles

- **Deterministic first:** no LLM reasoning for critical detection.
- **Local-first:** useful in a repo and CI without cloud infrastructure.
- **Metadata-only:** reports must not expose raw env or secret values.
- **Narrow MVP, broad roadmap:** implementation stays focused while roadmap content captures future search intent.
- **Low-noise:** findings must be specific and actionable.
- **Narrow wedge:** Secret Coverage validates environment readiness; it is not a secrets manager or vault.

## Current limitations

- Secret Coverage does not connect to cloud provider APIs yet.
- It does not verify that deployment platform secrets are actually configured remotely.
- It does not store or manage secrets.
- It uses deterministic static scanning, so dynamically generated variable names may be missed.

## Development

```bash
pnpm install
pnpm test
pnpm build
pnpm tsx src/cli.ts scan --path examples/fixtures/broken-app --ci
```

## License

Apache-2.0 © 2026 Leviro AI
