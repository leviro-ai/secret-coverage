# Azure Key Vault environment variable troubleshooting before deploy

Azure Key Vault can hold the real secret values, certificates, and connection strings, but an Azure deployment can still fail when the repository contract drifts away from the environment variables the app, CI job, container, Function App, App Service, or deployment script expects.

That is deployment drift. The secret may exist in one Key Vault, subscription, resource group, slot, or pipeline variable group, but the repo no longer documents the environment variable name that must be configured before deploy.

## Symptom

A change works locally or in one Azure environment, then fails in preview, staging, production, or a release job with errors like:

- `Missing required environment variable: DATABASE_URL`
- an App Service or Container App starts, then exits because `JWT_SECRET`, `STRIPE_SECRET_KEY`, `REDIS_URL`, or `OPENAI_API_KEY` is not set
- an Azure Functions deployment succeeds, but runtime code crashes because a required env var was added in code and not documented
- a GitHub Actions / Azure Pipelines / GitLab CI / CircleCI release step references an Azure-related variable that is missing from `.env.example` or `.env.dist`
- a deploy script expects `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`, `KEY_VAULT_NAME`, or `RESOURCE_GROUP`, but the repo template never mentions it

The usual sequence is:

1. A PR adds code, infrastructure config, or AI-generated deploy logic that expects a new variable.
2. Someone adds the real value in Azure Key Vault, App Service configuration, Container Apps secrets, Azure Functions settings, Azure Pipelines variable groups, or a CI secret store.
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

Secret Coverage checks variable names, file paths, references, and template coverage as metadata-only deployment readiness signals. It does not need Azure credentials, Azure Key Vault permissions, secret URIs, or secret values.

## What to look for

Treat these as Azure deployment-readiness risks:

- application code references `process.env.DATABASE_URL`, `process.env.STRIPE_SECRET_KEY`, `process.env.JWT_SECRET`, or similar variables, but the repo env template does not list them;
- CI deploy jobs reference `${{ secrets.AZURE_CLIENT_ID }}`, `${{ secrets.AZURE_TENANT_ID }}`, `$AZURE_SUBSCRIPTION_ID`, `$RESOURCE_GROUP`, `$KEY_VAULT_NAME`, or `$APP_SERVICE_NAME` without a documented repo contract;
- App Service configuration, Azure Functions settings, Container Apps secrets, Bicep/Terraform variables, or Docker entrypoints add a variable name that only exists in one Azure environment;
- Key Vault secret names or URIs are passed through env vars, but the env template does not show which names are required;
- AI-generated PRs add Azure deploy wiring while skipping the `.env.example` / `.env.dist` update.

A common workflow example:

```yaml
name: Deploy to Azure
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm deploy:azure
        env:
          AZURE_CLIENT_ID: ${{ secrets.AZURE_CLIENT_ID }}
          AZURE_TENANT_ID: ${{ secrets.AZURE_TENANT_ID }}
          AZURE_SUBSCRIPTION_ID: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
          KEY_VAULT_NAME: ${{ secrets.KEY_VAULT_NAME }}
          STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
```

But the repository template only says:

```dotenv
NEXT_PUBLIC_APP_URL=https://example.com
DATABASE_URL=
```

That means the deploy path has undocumented requirements: `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`, `KEY_VAULT_NAME`, and `STRIPE_SECRET_KEY`.

## Minimal fix

Update the repository contract first:

```dotenv
NEXT_PUBLIC_APP_URL=https://example.com
DATABASE_URL=
AZURE_CLIENT_ID=
AZURE_TENANT_ID=
AZURE_SUBSCRIPTION_ID=
KEY_VAULT_NAME=
STRIPE_SECRET_KEY=
```

Then configure the actual values in the systems that own the secrets or deployment metadata: Azure Key Vault, App Service configuration, Azure Functions application settings, Container Apps secrets, Azure Pipelines variable groups, GitHub Actions secrets, staging, and production.

For monorepos, scan the app or deployment directory that owns the Azure release path:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path apps/api --env-template .env.example --ci
```

## CI/CD review checklist

Before merging an Azure-related deployment PR, ask:

1. Did the PR add any new `process.env.X`, `$X`, `${X}`, `${{ secrets.X }}`, App Service setting, Function App setting, Container Apps secret, Bicep/Terraform variable, or deploy-script variable?
2. Does `.env.example` or `.env.dist` document the required variable name without committing the real value?
3. Are secret values stored in Azure/CI secret systems rather than copied into docs or repo files?
4. Do preview, staging, production, and local setup use the same documented env contract where they should?
5. Are subscription, resource-group, region, or slot-specific differences intentional and documented rather than accidental drift?

Secret Coverage helps with the env-contract drift part. It does not validate Azure RBAC, managed identity configuration, Key Vault access policies, resource existence, secret value correctness, App Service health, Azure Functions runtime behavior, Terraform/Bicep plan correctness, or cloud account state.

## Notes and limits

- Secret Coverage does not call Azure APIs.
- It does not read Azure Key Vault, App Service configuration, Azure Functions settings, Container Apps secrets, Azure Pipelines variable groups, or Terraform state.
- It does not replace Azure Key Vault, managed identities, RBAC, workload identity federation, SOPS, Vault, or cloud security review.
- It checks whether environment variables referenced by your repo are documented in the repo's env contract.

For broader review guidance, see the [CI/CD environment variable validation checklist](ci-cd-env-validation-checklist.md) and the [articles and demo index](README.md).
