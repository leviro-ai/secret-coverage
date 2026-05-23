# Terraform environment variable troubleshooting before apply

Terraform plans often fail for a mundane reason: a module, provider, backend, or CI job starts expecting a new environment variable, but the repository template does not document that deployment requirement.

That is deployment drift. The value might exist on one engineer's machine, in one CI context, or in one workspace, but the repo contract no longer tells reviewers, automation, or future operators what `terraform plan` / `terraform apply` needs.

## Symptom

A Terraform workflow works in one place, then fails in CI, preview infrastructure, staging, or production with errors like:

- `Error: No value for required variable`
- `AWS_ACCESS_KEY_ID is required`
- `GOOGLE_APPLICATION_CREDENTIALS must be set`
- `ARM_CLIENT_SECRET is not set`
- `TF_VAR_database_url is required`
- a remote-state or backend init step fails because credentials were only configured manually

The usual sequence is:

1. A PR adds a provider, backend, module, deploy script, or AI-generated infrastructure change.
2. The new path expects another `TF_VAR_*`, cloud-provider credential, or CI/CD token.
3. Someone configures the value in one local shell, CI context, or workspace.
4. `.env.example` or `.env.dist` is not updated.
5. The next `terraform plan`, preview, or deploy job discovers the missing contract late.

## Quick local check

Run Secret Coverage against the env template that represents your repository contract:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path . --env-template .env.example
```

If your team uses `.env.dist`:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path . --env-template .env.dist
```

To fail CI before an infrastructure deploy step:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path . --env-template .env.example --ci
```

Secret Coverage checks variable names, file paths, references, and template coverage as metadata-only deployment readiness signals. It does not need cloud-provider credentials, Terraform Cloud tokens, or raw secret values.

## What to look for

Treat these as Terraform deployment-readiness risks:

- CI workflows reference `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `GOOGLE_APPLICATION_CREDENTIALS`, `ARM_CLIENT_ID`, `ARM_CLIENT_SECRET`, or `CLOUDFLARE_API_TOKEN`, but the env template does not document the requirement;
- scripts export `TF_VAR_*` values that are missing from `.env.example` / `.env.dist`;
- backend init steps need remote-state credentials that only exist in one CI environment;
- a module introduces a new provider token or deploy key without a matching template update;
- AI-generated infrastructure PRs add provider/backend assumptions while skipping environment contract updates.

A common CI example:

```yaml
# .github/workflows/terraform.yml
env:
  AWS_REGION: us-east-1
  TF_VAR_database_url: ${{ secrets.TF_VAR_DATABASE_URL }}
  CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}

jobs:
  plan:
    steps:
      - run: terraform init
      - run: terraform plan
```

But the repository template only says:

```dotenv
AWS_REGION=us-east-1
```

That means the Terraform job has undocumented deployment requirements: `TF_VAR_DATABASE_URL` and `CLOUDFLARE_API_TOKEN`.

## Minimal fix

Update the repository contract first:

```dotenv
AWS_REGION=us-east-1
TF_VAR_DATABASE_URL=
CLOUDFLARE_API_TOKEN=
```

Then configure the actual values in the environments that run Terraform: local development, CI, preview infrastructure, staging, production, or workspace-specific automation.

For monorepos, scan the app, infra package, or deployment directory that owns the Terraform workflow:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path infra --env-template .env.example --ci
```

## CI/CD review checklist

Before merging a Terraform-related PR, ask:

1. Did the PR add any new `TF_VAR_*`, provider credential, backend credential, `$X`, `${X}`, or `${{ secrets.X }}` reference?
2. Does the env template document the variable name without committing the real value?
3. Are provider credentials separated from public/non-secret configuration such as region names?
4. Do plan and apply jobs share the same documented environment contract?
5. Are workspace-specific differences intentional and documented rather than accidental drift?

Secret Coverage helps with the env-contract drift part. It does not validate Terraform syntax, provider permissions, cloud IAM policy, state locking, or whether the credential value is correct.

## Notes and limits

- Secret Coverage does not call Terraform Cloud, OpenTofu, AWS, GCP, Azure, or Cloudflare APIs.
- It does not inspect remote state or cloud account settings.
- It does not replace Terraform variables, a vault, cloud IAM, or runtime secret injection.
- It checks whether variables referenced by your repo are documented in the repo's env contract.

For broader review guidance, see the [CI/CD environment variable validation checklist](ci-cd-env-validation-checklist.md) and the [articles and demo index](README.md).
