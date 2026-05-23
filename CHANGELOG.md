# Changelog

## 0.1.36 — Unreleased

### Fixed

- CircleCI scanning now ignores common CircleCI-provided shell variables such as `CIRCLE_BRANCH`, `CIRCLE_SHA1`, and `CIRCLE_WORKFLOW_ID` while still reporting user-provided deployment variables.

## 0.1.35 — Unreleased

### Fixed

- GitLab CI scanning now treats safe inline `variables:` literals as already defined while still reporting empty or externally referenced variables.

## 0.1.34 — Unreleased

### Fixed

- Kubernetes `envFrom` same-file Secret/ConfigMap resolution now applies valid `prefix` values to reported environment variable names.

## 0.1.33 — Unreleased

### Changed

- npm package metadata now explicitly allowlists `LICENSE` so the Apache-2.0 license file stays visible in dry-run/release checks.

## 0.1.32 — Unreleased

### Fixed

- Release checklist shebang regression test now allows enough time for `pnpm build` on slower runners.

## 0.1.31 — Unreleased

### Changed

- Release readiness checks now require the changelog to include the current package version before package publication.

## 0.1.30 — Unreleased

### Changed

- npm package dry-run metadata now explicitly includes `CHANGELOG.md` in the package file allowlist.

### Added

- Static local-first scanners for Jenkinsfile, Railway, Render, Fly.io, Firebase, Coolify, CapRover Docker build args, Terraform, Kubernetes manifests, AWS Secrets Manager metadata, Azure Key Vault metadata, HashiCorp Vault metadata, and Supabase Edge Function `Deno.env.get(...)` references.
- Kubernetes static scanning can resolve same-file `envFrom` Secret/ConfigMap keys without cluster/API access.

## 0.1.3 — Unreleased

### Fixed

- CircleCI scanner now ignores non-secret inline `environment` literals such as tool versions by default, while still reporting unresolved external env references.

## 0.1.0 — Unreleased

### Added

- TypeScript CLI with `scan` command.
- Markdown and JSON output.
- CI and strict exit modes.
- Deterministic scanners for `.env` metadata, GitHub Actions, GitLab CI/CD, CircleCI, Dockerfile / Docker Compose, and Vercel detection heuristics.
- Roadmap-visible deterministic scanners/docs for Next.js, Supabase, CapRover, and planned integrations without broadening v0.1.0 MVP support claims.
- GitHub Action metadata with CI log output and Markdown step-summary support.
- Fixture-based tests and generated sample reports.

### Security and trust

- Local-first, metadata-only scanning: reports include variable names, source files, finding types, and recommendations only.
- JSON and Markdown report tests prove Secret Coverage emits no raw secret values, even when plaintext-secret findings are detected.
- Release gates require Darius approval before npm publishing or GitHub releases.
