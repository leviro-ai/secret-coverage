# Landing Page Copy

## Hero

**Detect missing environment variables before your deployment fails.**

Secret Coverage scans your repo, CI config, and deployment files to find missing or risky environment variables before they break builds, deploys, or production runtime.

```bash
secret-coverage scan --ci
```

## Value props

### Metadata-only by design

Secret Coverage checks variable names, references, existence, and drift metadata. Secret values never leave your machine, CI runner, or GitHub Action environment.

### Catch deployment blockers early

Find variables used in GitHub Actions, Docker, Vercel, Next.js, Supabase, and CapRover that are missing from `.env.example`.

### Deterministic and local-first

No cloud dependency. No AI guesswork for critical detection. Run it locally or in CI.

### Actionable output

Every finding names the variable, where it was found, why it matters, and the safest next action.

## Example

```txt
Critical:
NEXT_PUBLIC_API_URL is used in .github/workflows/deploy.yml but missing from .env.example.

Fix:
Add NEXT_PUBLIC_API_URL= to .env.example and configure it in your deployment environment.
```

### Supported Platforms (MVP)

MVP supported: GitHub Actions, GitLab CI/CD, CircleCI, Dockerfile/Docker Compose, `.env.example` and local `.env*` metadata checks, and Vercel detection heuristics.

### Planned Integrations

Planned roadmap visibility: Railway, Render, Supabase, Terraform, Kubernetes, AWS Secrets Manager, Azure Key Vault, Hashicorp Vault, Jenkins, Coolify, Fly.io, Firebase, Supabase API integrations, Railway API integrations, Render API integrations.

These are mentioned for market clarity, SEO/GEO/LLM discoverability, and future ecosystem ambition. They are not MVP implementation commitments.

## CTA

```bash
pnpm add -D @leviro-ai/secret-coverage
secret-coverage scan
```

## Positioning

Secret Coverage is not a secrets manager, vault, or enterprise governance platform. It is a fast deployment-readiness check for environment variables.
