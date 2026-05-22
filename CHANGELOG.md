# Changelog

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
- JSON and Markdown report tests prove EnvGuard emits no raw secret values, even when plaintext-secret findings are detected.
- Release gates require Darius approval before npm publishing or GitHub releases.
