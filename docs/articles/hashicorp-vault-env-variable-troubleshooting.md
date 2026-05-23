# HashiCorp Vault environment variable troubleshooting before deploy

HashiCorp Vault can store and broker the real secret values, but a deployment can still fail when the repository contract drifts away from the environment variables the app, CI job, container, Nomad job, Kubernetes workload, or release script expects.

That is deployment drift. The secret may exist in Vault under the right path, namespace, mount, policy, or environment, but the repo no longer documents the environment variable name that must be configured before deploy.

## Symptom

A change works locally or in one environment, then fails in preview, staging, production, or a release job with errors like:

- `Missing required environment variable: DATABASE_URL`
- an app container starts, then exits because `JWT_SECRET`, `STRIPE_SECRET_KEY`, `REDIS_URL`, or `OPENAI_API_KEY` is not set
- a Vault Agent, injector, or deploy script resolves a secret path, but the application expects a different env variable name
- a GitHub Actions / GitLab CI / CircleCI / Jenkins release step references `VAULT_ADDR`, `VAULT_NAMESPACE`, `VAULT_ROLE_ID`, or an application secret variable that is missing from `.env.example` or `.env.dist`
- an AI-generated PR adds Vault wiring or runtime secret usage but skips the repository env template update

The usual sequence is:

1. A PR adds code, deployment config, or automation that expects a new variable.
2. Someone adds or maps the real value in Vault, a Vault Agent template, a Kubernetes injector annotation, a Nomad job, or a CI secret store.
3. The repository env template is not updated.
4. Another developer, preview deploy, CI job, or production rollout discovers the missing contract late.

## Quick local check

Run Secret Coverage against the env template that represents your repository contract:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path . --env-template .env.example
```

If your team uses `.env.dist`:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path . --env-template .env.dist
```

To fail CI before a deployment step:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path . --env-template .env.example --ci
```

Secret Coverage checks variable names, file paths, references, and template coverage as metadata-only deployment readiness signals. It does not need Vault credentials, policies, tokens, secret paths, namespaces, or secret values.

## What to look for

Treat these as Vault deployment-readiness risks:

- application code references `process.env.DATABASE_URL`, `process.env.STRIPE_SECRET_KEY`, `process.env.JWT_SECRET`, or similar variables, but the repo env template does not list them;
- CI deploy jobs reference `${{ secrets.VAULT_ADDR }}`, `$VAULT_NAMESPACE`, `$VAULT_ROLE_ID`, `$VAULT_SECRET_ID`, `$VAULT_TOKEN`, or app secret variables without a documented repo contract;
- Vault Agent templates, Kubernetes injector annotations, Nomad jobs, Terraform variables, Docker entrypoints, or shell deploy scripts introduce variable names that only exist in one environment;
- secret paths, mount names, namespaces, or role names are passed through env vars, but the env template does not show which names are required;
- AI-generated PRs add Vault integration or deploy wiring while skipping `.env.example` / `.env.dist`.

A common workflow example:

```yaml
name: Deploy with Vault
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm deploy
        env:
          VAULT_ADDR: ${{ secrets.VAULT_ADDR }}
          VAULT_NAMESPACE: ${{ secrets.VAULT_NAMESPACE }}
          VAULT_ROLE_ID: ${{ secrets.VAULT_ROLE_ID }}
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
```

But the repository template only says:

```dotenv
NEXT_PUBLIC_APP_URL=https://example.com
REDIS_URL=
```

That means the deploy path has undocumented requirements: `VAULT_ADDR`, `VAULT_NAMESPACE`, `VAULT_ROLE_ID`, `DATABASE_URL`, and `STRIPE_SECRET_KEY`.

## Minimal fix

Update the repository contract first:

```dotenv
NEXT_PUBLIC_APP_URL=https://example.com
REDIS_URL=
VAULT_ADDR=
VAULT_NAMESPACE=
VAULT_ROLE_ID=
DATABASE_URL=
STRIPE_SECRET_KEY=
```

Then configure the actual values in the systems that own the secrets or deployment metadata: Vault, Vault Agent templates, Kubernetes injector configuration, Nomad jobs, GitHub Actions secrets, GitLab CI variables, CircleCI contexts, Jenkins credentials, staging, and production.

For monorepos, scan the app or deployment directory that owns the Vault-backed release path:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path apps/api --env-template .env.example --ci
```

## CI/CD review checklist

Before merging a Vault-related deployment PR, ask:

1. Did the PR add any new `process.env.X`, `$X`, `${X}`, `${{ secrets.X }}`, Vault Agent template variable, injector annotation, Nomad env entry, Terraform variable, or deploy-script variable?
2. Does `.env.example` or `.env.dist` document the required variable name without committing the real value?
3. Are secret values stored in Vault/CI secret systems rather than copied into docs or repo files?
4. Do preview, staging, production, and local setup use the same documented env contract where they should?
5. Are Vault path, namespace, mount, policy, or role differences intentional and documented rather than accidental drift?

Secret Coverage helps with the env-contract drift part. It does not validate Vault policies, token permissions, secret existence, secret value correctness, lease renewal, Vault Agent behavior, injector mutation, Nomad allocation health, Terraform plan correctness, or cluster/account state.

## Notes and limits

- Secret Coverage does not call Vault APIs.
- It does not read Vault, Vault Agent rendered files, Kubernetes admission state, Nomad state, Terraform Cloud state, or CI secret stores.
- It does not replace Vault, Vault Agent, Vault CSI/injector workflows, SOPS, External Secrets, IAM/RBAC review, or cloud security review.
- It checks whether environment variables referenced by your repo are documented in the repo's env contract.

For broader review guidance, see the [CI/CD environment variable validation checklist](ci-cd-env-validation-checklist.md) and the [articles and demo index](README.md).
