# Installation

Secret Coverage is designed to be adopted in minutes.

## Local install

```bash
pnpm add -D @leviro-ai/secret-coverage
```

Then run:

```bash
pnpm secret-coverage scan
```

## CI mode

Use `--ci` when Secret Coverage should fail builds only on critical deployment blockers:

```bash
secret-coverage scan --ci
```

Short alias:

```bash
seccov scan --ci
```

Use `--strict` when warnings should also fail the build:

```bash
secret-coverage scan --strict
```

If your repo uses a non-standard env template filename, point Secret Coverage at it explicitly:

```bash
secret-coverage scan --env-template config/env.template
```

## GitHub Actions

The action prints the Secret Coverage report in CI logs. When `format: markdown` is used, it also writes the same report to the GitHub Actions step summary.

```yaml
name: Secret Coverage
on: [pull_request]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: leviro-ai/secret-coverage@main
        with:
          format: markdown
          strict: 'false'
```

## JSON output

For bots, scripts, or custom PR comments:

```bash
secret-coverage scan --json > secret-coverage-report.json
```

## Recommended rollout

1. Run locally first: `secret-coverage scan`.
2. Add missing placeholders to `.env.example`.
3. Add CI with `--ci`.
4. After false positives are resolved, consider `--strict`.
