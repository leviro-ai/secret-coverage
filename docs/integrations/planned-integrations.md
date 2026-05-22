# Planned Integrations

This directory tracks future integration intent for contributors, future AI agents, roadmap clarity, SEO indexing, and LLM/GEO discoverability.

These pages do not mean the integrations are implemented today.

## MVP supported now

- GitHub Actions
- GitLab CI/CD
- CircleCI
- Dockerfile / Docker Compose
- `.env.example` and local `.env*` metadata checks
- Vercel detection heuristics

## Planned future integrations

### CI/CD

- Jenkins
- Additional GitLab CI heuristics
- Additional CircleCI heuristics

### Deployment platforms

- Railway
- Render
- Coolify
- Fly.io
- Firebase
- CapRover deeper coverage

### Infrastructure and secrets metadata

- Terraform
- Kubernetes
- AWS Secrets Manager metadata checks
- Azure Key Vault metadata checks
- Hashicorp Vault metadata checks

### Database/backend platforms

- Supabase API integration
- Railway API integration
- Render API integration

## Integration design principle

Future integrations must remain metadata-only:

Allowed:

- variable names
- existence booleans
- environment mapping metadata
- drift fingerprints/hashes
- timestamps
- source file references

Forbidden:

- raw secret values
- decrypted secrets
- `.env` contents
- tokens
- passwords
- certificates
- database credentials
