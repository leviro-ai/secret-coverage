# AWS Secrets Manager environment variable troubleshooting before deploy

AWS Secrets Manager can store the real values safely, but deployments can still fail when the repository contract drifts away from the variables the application, CI job, container, Lambda function, ECS task, or deployment script expects.

That is deployment drift. The secret may exist in one AWS account, region, stage, or task definition, but the repo no longer documents the environment variable name that must be configured before deploy.

## Symptom

A change works locally or in one AWS environment, then fails in preview, staging, production, or a release job with errors like:

- `Missing required environment variable: DATABASE_URL`
- `AccessDeniedException` or `ResourceNotFoundException` while a deploy script tries to resolve a secret name from an env var
- an ECS task starts, then the app exits because `JWT_SECRET`, `STRIPE_SECRET_KEY`, `REDIS_URL`, or `OPENAI_API_KEY` is not set
- a Lambda function deploys, but runtime code crashes because a required env var was added in code and not documented
- a GitHub Actions / GitLab CI / CircleCI release step references an AWS secret-related variable that is missing from `.env.example` or `.env.dist`

The usual sequence is:

1. A PR adds code, infrastructure config, or AI-generated deploy logic that expects a new variable.
2. Someone adds the real value in AWS Secrets Manager, ECS task configuration, Lambda environment variables, SSM Parameter Store, or a CI secret store.
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

Secret Coverage checks variable names, file paths, references, and template coverage as metadata-only deployment readiness signals. It does not need AWS credentials, AWS Secrets Manager permissions, secret ARNs, or secret values.

## What to look for

Treat these as AWS deployment-readiness risks:

- application code references `process.env.DATABASE_URL`, `process.env.STRIPE_SECRET_KEY`, `process.env.JWT_SECRET`, or similar variables, but the repo env template does not list them;
- CI deploy jobs reference `${{ secrets.AWS_ACCESS_KEY_ID }}`, `${{ secrets.AWS_SECRET_ACCESS_KEY }}`, `$AWS_REGION`, `$ECS_CLUSTER`, `$ECS_SERVICE`, or `$TASK_FAMILY` without a documented repo contract;
- ECS task definitions, Lambda deploy scripts, CDK/Terraform outputs, or Docker entrypoints add a variable name that only exists in one AWS environment;
- secret names and ARNs are passed through env vars, but the env template does not show which names are required;
- AI-generated PRs add AWS deploy wiring while skipping the `.env.example` / `.env.dist` update.

A common workflow example:

```yaml
name: Deploy API
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm deploy:ecs
        env:
          AWS_REGION: ${{ secrets.AWS_REGION }}
          ECS_CLUSTER: ${{ secrets.ECS_CLUSTER }}
          ECS_SERVICE: ${{ secrets.ECS_SERVICE }}
          STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
```

But the repository template only says:

```dotenv
NEXT_PUBLIC_APP_URL=https://example.com
DATABASE_URL=
```

That means the deploy path has undocumented requirements: `AWS_REGION`, `ECS_CLUSTER`, `ECS_SERVICE`, and `STRIPE_SECRET_KEY`.

## Minimal fix

Update the repository contract first:

```dotenv
NEXT_PUBLIC_APP_URL=https://example.com
DATABASE_URL=
AWS_REGION=
ECS_CLUSTER=
ECS_SERVICE=
STRIPE_SECRET_KEY=
```

Then configure the actual values in the systems that own the secrets or deployment metadata: AWS Secrets Manager, SSM Parameter Store, ECS task definitions, Lambda environment variables, GitHub Actions secrets, GitLab CI variables, CircleCI contexts, staging, and production.

For monorepos, scan the app or deployment directory that owns the AWS release path:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path apps/api --env-template .env.example --ci
```

## CI/CD review checklist

Before merging an AWS-related deployment PR, ask:

1. Did the PR add any new `process.env.X`, `$X`, `${X}`, `${{ secrets.X }}`, ECS/Lambda env entry, CDK/Terraform variable, or deploy-script variable?
2. Does `.env.example` or `.env.dist` document the required variable name without committing the real value?
3. Are secret values stored in AWS/CI secret systems rather than copied into docs or repo files?
4. Do preview, staging, production, and local setup use the same documented env contract where they should?
5. Are account/region-specific differences intentional and documented rather than accidental drift?

Secret Coverage helps with the env-contract drift part. It does not validate IAM permissions, AWS resource existence, secret value correctness, ECS task health, Lambda runtime behavior, Terraform plan correctness, or cloud account state.

## Notes and limits

- Secret Coverage does not call AWS APIs.
- It does not read AWS Secrets Manager, SSM Parameter Store, ECS, Lambda, CloudFormation, or Terraform Cloud state.
- It does not replace AWS Secrets Manager, IAM, SSM Parameter Store, external secrets operators, Vault, SOPS, or cloud security review.
- It checks whether environment variables referenced by your repo are documented in the repo's env contract.

For broader review guidance, see the [CI/CD environment variable validation checklist](ci-cd-env-validation-checklist.md) and the [articles and demo index](README.md).
