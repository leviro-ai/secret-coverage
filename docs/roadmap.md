# EnvGuard Roadmap

## v0.1.0 — Local-first MVP

- TypeScript CLI.
- Deterministic scanner engine.
- Markdown and JSON output.
- GitHub Action wrapper.
- Fixture-based tests and sample reports.
- Initial scanner support for GitHub Actions, CircleCI, Docker, Vercel, Next.js, Supabase, and CapRover.

## v0.2.0 — Better scanner precision

- More framework-specific reference detection.
- Better Docker Compose environment parsing.
- More precise secret heuristics with lower false positives.
- Configurable ignore list.

## v0.3.0 — PR review ergonomics

- GitHub Action summary output.
- Optional PR comment generation.
- Better readiness score explanation.
- Suggested `.env.example` patch output.

## Later — Only after adoption

- Environment drift history.
- Slack alerts.
- Team collaboration.
- Org-wide repository scanning.
- Deployment audit trail.

## Non-goals

- Secret storage.
- Vault replacement.
- Enterprise IAM.
- Compliance bureaucracy.
