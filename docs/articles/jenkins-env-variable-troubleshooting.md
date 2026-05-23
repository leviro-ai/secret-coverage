# Jenkins environment variable troubleshooting before deploy

Jenkins can store credentials and inject environment variables into Pipeline, Freestyle, Docker, Kubernetes, and release jobs. Deployments can still fail when the repository contract drifts away from the variable names those jobs expect.

That is deployment drift. The secret may exist in Jenkins Credentials, a folder credential store, a Kubernetes secret, or a node-level environment setting, but the repo no longer documents the environment variable name required before deploy.

## Symptom

A pipeline works in one Jenkins job or branch, then fails in staging, production, a new agent, or a copied job with errors like:

- `Missing required environment variable: DEPLOY_TOKEN`
- `DATABASE_URL is not set`
- `No credentials found for env var AWS_ACCESS_KEY_ID`
- a Docker build, shell deploy step, or Node.js script references `$NPM_TOKEN`, `$DOCKER_PASSWORD`, `$SLACK_WEBHOOK_URL`, or `$STRIPE_SECRET_KEY`, but the repo env template does not mention it
- an AI-generated PR updates `Jenkinsfile` or deploy scripts but skips `.env.example` / `.env.dist`

The usual sequence is:

1. A PR adds a new variable to `Jenkinsfile`, a shell deploy step, a Docker build arg, or app code.
2. Someone configures the real value in Jenkins Credentials or one Jenkins folder/job.
3. The repository env template is not updated.
4. A different branch, job, agent, environment, or teammate discovers the missing contract late.

## Quick local check

Run Secret Coverage against the env template that represents your repository contract:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path . --env-template .env.example
```

If your team uses `.env.dist`:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path . --env-template .env.dist
```

To fail CI before a Jenkins deploy stage runs:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path . --env-template .env.example --ci
```

Secret Coverage checks variable names, file paths, references, and template coverage as metadata-only deployment readiness signals. It does not need Jenkins credentials, credential IDs, API tokens, job configuration exports, or secret values.

## What to look for

Treat these as Jenkins deployment-readiness risks:

- `Jenkinsfile` stages reference `$DEPLOY_TOKEN`, `$NPM_TOKEN`, `$DOCKER_PASSWORD`, `$AWS_ACCESS_KEY_ID`, or `$DATABASE_URL`, but the repo env template does not list them;
- `withCredentials`, `environment`, `sh`, or Docker build steps introduce variable names that exist only in one Jenkins job;
- deploy scripts invoked by Jenkins reference env vars that are not documented in `.env.example` / `.env.dist`;
- copied jobs or folder-level credentials hide missing repo documentation;
- AI-generated PRs update pipeline automation while skipping the env contract.

A common Jenkins Pipeline example:

```groovy
pipeline {
  agent any

  environment {
    NODE_ENV = 'production'
    DEPLOY_TOKEN = credentials('deploy-token')
  }

  stages {
    stage('Deploy') {
      steps {
        sh 'pnpm install --frozen-lockfile'
        sh 'DATABASE_URL=$DATABASE_URL DEPLOY_TOKEN=$DEPLOY_TOKEN pnpm deploy'
      }
    }
  }
}
```

But the repository template only says:

```dotenv
NEXT_PUBLIC_APP_URL=https://example.com
REDIS_URL=
```

That means the Jenkins deploy path has undocumented requirements: `DEPLOY_TOKEN` and `DATABASE_URL`.

## Minimal fix

Update the repository contract first:

```dotenv
NEXT_PUBLIC_APP_URL=https://example.com
REDIS_URL=
DEPLOY_TOKEN=
DATABASE_URL=
```

Then configure the actual values in the systems that own the secrets or deployment metadata: Jenkins Credentials, folder/job configuration, Kubernetes agent secrets, staging, production, and any deployment platform.

For monorepos, scan the app or deployment directory that owns the Jenkins release path:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path apps/api --env-template .env.example --ci
```

## Jenkins review checklist

Before merging a Jenkins-related deployment PR, ask:

1. Did the PR add any new `process.env.X`, `$X`, `${X}`, `withCredentials` binding, `environment` entry, Docker build arg, or deploy-script variable?
2. Does `.env.example` or `.env.dist` document the required variable name without committing the real value?
3. Are secret values stored in Jenkins Credentials or the appropriate deployment system rather than copied into repo files?
4. Will copied jobs, branch jobs, staging, and production use the same documented env contract where they should?
5. Are credential IDs, folder inheritance, and agent-specific environment assumptions documented separately from the variable-name contract?

Secret Coverage helps with the env-contract drift part. It does not validate Jenkins credential existence, folder permissions, credential binding correctness, plugin behavior, agent state, Pipeline syntax, or whether the deployed value is correct.

## Notes and limits

- Secret Coverage does not call the Jenkins API.
- It does not read Jenkins Credentials, job configuration, folder configuration, build logs, agents, Kubernetes pod templates, or secret values.
- It does not replace Jenkins credential management, RBAC review, plugin audits, or deployment-platform checks.
- It checks whether environment variables referenced by your repo are documented in the repo's env contract.

For broader review guidance, see the [CI/CD environment variable validation checklist](ci-cd-env-validation-checklist.md) and the [articles and demo index](README.md).
