# Strategic Roadmap

EnvGuard separates MVP implementation scope from roadmap visibility.

## Product rule

Implementation scope stays narrow. Narrative scope can be broader.

Do not confuse roadmap visibility with implementation complexity.

## MVP implementation scope

MVP supported:

- `.env.example` and local `.env*` metadata checks
- GitHub Actions env validation
- GitLab CI/CD environment validation
- CircleCI environment validation
- Dockerfile and Docker Compose env mismatch detection
- Vercel detection heuristics

No remote provider API integrations are required for MVP.

## Roadmap visibility scope

These platforms should exist in README roadmap, TODOs, docs structure, SEO/GEO pages, and future integration notes even before implementation:

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

## Guardrails

- Do not build cloud APIs before local-first adoption.
- Do not store secrets.
- Do not upload raw environment values.
- Do not let roadmap content imply completed API integrations.
- Clearly label planned integrations as planned.
