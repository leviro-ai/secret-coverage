# Env template vs secret manager: where deployment drift actually hides

Secret managers store real values. Env templates document the variable names your repo expects. Deployment drift often appears in the gap between those two layers.

If a deploy fails with a missing environment variable, the problem is not always that the value does not exist anywhere. Sometimes the value exists in one environment, CI job, or teammate laptop, but the repository never documented that the variable is required.

Secret Coverage checks that repository contract without reading secret values.

## The short version

Use a secret manager for values:

- production API tokens;
- database passwords;
- webhook signing secrets;
- OAuth client secrets;
- private deploy keys.

Use an env template for the contract:

```dotenv
DATABASE_URL=
STRIPE_SECRET_KEY=
REDIS_URL=
NEXT_PUBLIC_APP_URL=https://example.com
```

Use Secret Coverage to catch drift between the contract and deployment config:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path . --ci
```

The scanner reports variable names and files, not raw secret values.

## Why secret managers do not replace env templates

A secret manager can answer:

> What is the production value for `STRIPE_SECRET_KEY`?

An env template answers a different review question:

> Is `STRIPE_SECRET_KEY` a required input for this repo at all?

That second question matters during pull request review. Reviewers usually should not see production secret values, but they do need to know when a PR adds a new deployment requirement.

For example, this GitHub Actions workflow introduces a new requirement:

```yaml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
```

If `.env.example` still says only this:

```dotenv
DATABASE_URL=
```

then the repository contract is incomplete. The secret may exist in GitHub, 1Password, Vault, Doppler, AWS Secrets Manager, Azure Key Vault, or another system — but the repo still does not tell contributors and CI reviewers that the variable is required.

## What Secret Coverage checks

Secret Coverage compares metadata from supported repo files:

- env templates such as `.env.example` and `.env.dist`;
- GitHub Actions workflows;
- GitLab CI configs;
- CircleCI configs;
- Dockerfiles and Docker Compose files;
- Vercel config heuristics;
- supported source/config references such as `process.env.SECRET_NAME`.

It looks for variables referenced by deployment surfaces but missing from the env template.

Example finding:

```txt
STRIPE_SECRET_KEY is used in .github/workflows/deploy.yml but missing from an env template.
Fix: Add STRIPE_SECRET_KEY= to an env template and configure the value in your deployment environment.
```

That finding does not say the secret value is missing from every platform. It says the repository contract is missing a required variable name.

## A safe workflow for teams

1. Keep real values in your secret manager or deployment platform.
2. Keep required variable names in `.env.example` or `.env.dist`.
3. Review CI/CD, Docker, and platform config changes alongside env-template changes.
4. Run a metadata-only check before merge:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path . --ci
```

5. If the scanner reports drift, update the template with empty placeholders, not real values:

```dotenv
DATABASE_URL=
STRIPE_SECRET_KEY=
REDIS_URL=
```

## What not to put in env templates

Do not put production secret values in template files:

```dotenv
# Bad: raw secret value in a template
STRIPE_SECRET_KEY=sk_live_do_not_commit_this
```

Use empty placeholders or safe dummy examples:

```dotenv
# Good: contract only
STRIPE_SECRET_KEY=

# Also acceptable for public non-secret config
NEXT_PUBLIC_APP_URL=https://example.com
```

## Where this fits with Vault, AWS Secrets Manager, Azure Key Vault, and Doppler

Secret Coverage is not a replacement for those systems.

It does not:

- pull secret values from a vault;
- verify production values;
- rotate credentials;
- manage access policies;
- require cloud credentials.

It does:

- check whether repo-visible config references variables missing from repo-visible templates;
- keep PR review metadata-only;
- make deployment requirements easier to spot before CI or deploy fails;
- help AI-generated PRs avoid silently adding undocumented environment assumptions.

## Practical rule

If a variable is required for the app, worker, deploy job, or infrastructure step to run, its name should usually appear in the repo contract.

The secret manager owns the value. The env template owns the expectation. Secret Coverage checks whether those expectations drift from the files developers actually change.
