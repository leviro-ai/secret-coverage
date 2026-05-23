# Kubernetes environment variable troubleshooting before rollout

Kubernetes rollouts often fail for a simple reason: a Deployment, Job, CronJob, Helm chart, or Kustomize overlay starts expecting a new environment variable, but the repository template does not document that deployment requirement.

That is deployment drift. The value might exist in one namespace, one Secret, one ConfigMap, or one cluster, but the repo contract no longer tells reviewers, CI, or future operators what the workload needs before `kubectl apply`, Helm release, or GitOps sync.

## Symptom

A Kubernetes change works in one environment, then fails during preview, staging, production, or GitOps reconciliation with errors like:

- `CreateContainerConfigError`
- `Error: secret "app-secrets" not found`
- `configmap "app-config" not found`
- a pod starts but the app crashes because `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, or `STRIPE_SECRET_KEY` is missing
- a Helm release succeeds, but a worker Job fails because a chart value introduced a new env var that was never documented

The usual sequence is:

1. A PR adds or changes a Deployment, Job, Helm values file, Kustomize patch, or AI-generated manifest.
2. The workload references another `env`, `envFrom`, Secret key, ConfigMap key, or CI-injected variable.
3. Someone configures the value in one namespace or cluster.
4. `.env.example` or `.env.dist` is not updated.
5. The next rollout discovers the missing environment contract late.

## Quick local check

Run Secret Coverage against the env template that represents your repository contract:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path . --env-template .env.example
```

If your team uses `.env.dist`:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path . --env-template .env.dist
```

To fail CI before a rollout step:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path . --env-template .env.example --ci
```

Secret Coverage checks variable names, file paths, references, and template coverage as metadata-only deployment readiness signals. It does not need kubeconfig access, cluster credentials, Secret values, or ConfigMap values.

## What to look for

Treat these as Kubernetes deployment-readiness risks:

- manifests define `env:` entries that reference `secretKeyRef` or `configMapKeyRef`, but the repo env template does not document the app-level variable name;
- Helm values introduce `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `STRIPE_SECRET_KEY`, `SENTRY_DSN`, or provider tokens without a matching template update;
- Kustomize overlays differ by environment and hide a required variable in only one namespace;
- GitHub Actions, GitLab CI, CircleCI, or deploy scripts reference kube deploy variables that are missing from `.env.example` / `.env.dist`;
- AI-generated Kubernetes PRs add manifests, Jobs, or chart values while skipping environment contract updates.

A common manifest example:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  template:
    spec:
      containers:
        - name: web
          image: ghcr.io/acme/web:latest
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: web-secrets
                  key: database-url
            - name: STRIPE_SECRET_KEY
              valueFrom:
                secretKeyRef:
                  name: web-secrets
                  key: stripe-secret-key
```

But the repository template only says:

```dotenv
NEXT_PUBLIC_APP_URL=https://example.com
```

That means the workload has undocumented deployment requirements: `DATABASE_URL` and `STRIPE_SECRET_KEY`.

## Minimal fix

Update the repository contract first:

```dotenv
NEXT_PUBLIC_APP_URL=https://example.com
DATABASE_URL=
STRIPE_SECRET_KEY=
```

Then configure the actual values in the environments that run the workload: local development, CI, preview namespace, staging, production, Helm values, External Secrets, Sealed Secrets, or your cluster-specific secret manager.

For monorepos, scan the app, chart, or deployment directory that owns the Kubernetes manifests:

```bash
pnpm dlx @leviro-ai/secret-coverage scan --path deploy/kubernetes --env-template .env.example --ci
```

## CI/CD review checklist

Before merging a Kubernetes-related PR, ask:

1. Did the PR add any new `env`, `envFrom`, `secretKeyRef`, `configMapKeyRef`, Helm value, Kustomize patch, `$X`, `${X}`, or `${{ secrets.X }}` reference?
2. Does the env template document the application variable name without committing the real value?
3. Are public config values separated from secret values?
4. Do preview, staging, and production namespaces share the same documented environment contract where they should?
5. Are intentional namespace differences documented rather than accidental drift?

Secret Coverage helps with the env-contract drift part. It does not validate Kubernetes schema, RBAC, image pull secrets, cluster state, admission policies, Helm rendering correctness, or whether the secret value is correct.

## Notes and limits

- Secret Coverage does not call the Kubernetes API server.
- It does not read Kubernetes Secret values or ConfigMap values from a cluster.
- Secret Coverage does not replace External Secrets, Sealed Secrets, SOPS, Vault, cloud secret managers, Helm, Kustomize, or GitOps controllers.
- It checks whether environment variables referenced by your repo are documented in the repo's env contract.

For broader review guidance, see the [CI/CD environment variable validation checklist](ci-cd-env-validation-checklist.md) and the [articles and demo index](README.md).
