# Installation

EnvGuard is designed to be adopted in minutes.

## Local install

```bash
pnpm add -D envguard
```

Then run:

```bash
pnpm envguard scan
```

## CI mode

Use `--ci` when EnvGuard should fail builds only on critical deployment blockers:

```bash
envguard scan --ci
```

Use `--strict` when warnings should also fail the build:

```bash
envguard scan --strict
```

## GitHub Actions

The action prints the EnvGuard report in CI logs. When `format: markdown` is used, it also writes the same report to the GitHub Actions step summary.

```yaml
name: EnvGuard
on: [pull_request]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: your-org/envguard@v0.1.0
        with:
          format: markdown
          strict: 'false'
```

## JSON output

For bots, scripts, or custom PR comments:

```bash
envguard scan --json > envguard-report.json
```

## Recommended rollout

1. Run locally first: `envguard scan`.
2. Add missing placeholders to `.env.example`.
3. Add CI with `--ci`.
4. After false positives are resolved, consider `--strict`.
