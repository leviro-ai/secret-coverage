# Secret Coverage Autonomous Build Plan

> **For Hermes:** execute this as a long-running product build, not as a one-shot. Use TDD for scanner behavior, keep scope narrow, and ship small verified increments.

**Goal:** Build Secret Coverage into a trustworthy local-first CLI/GitHub Action that detects missing or risky environment variables before deployment fails.

**Architecture:** TypeScript Node CLI with deterministic scanners per platform. Scanner modules emit normalized declarations/references/findings; engine derives cross-file findings; formatters produce Markdown/JSON. No cloud dependency in MVP. Secret Coverage is local-first and metadata-only: secret values must never leave the developer machine, CI runner, or GitHub Action environment.

**Tech Stack:** TypeScript, Node.js >=20, pnpm, Vitest, commander, fast-glob, yaml, GitHub Actions.

**Security Positioning:** Secret Coverage is not a secret manager, vault, credential store, or secret synchronization system. It is deployment readiness monitoring, configuration observability, env drift detection, CI/CD consistency validation, and deployment risk analysis.

---

## Current State Snapshot

Already created under `/Users/matilda/www/secret-coverage`:

- `package.json`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`, `action.yml`
- TDD test file: `tests/scanner.test.ts`
- Source skeleton and first implementation pass under `src/`
- First RED test was observed: tests failed because `src/index.js` did not exist yet.

This is not release-ready. Treat current code as a draft that must be verified, corrected, and hardened.

---

## Definition of Done — MVP v0.1.0

### Product DoD

- [x] `secret-coverage scan` works from any repo root.
- [x] `secret-coverage scan --format markdown` prints concise actionable Markdown.
- [x] `secret-coverage scan --json` prints stable machine-readable JSON.
- [x] `secret-coverage scan --strict` exits non-zero on critical or warning findings.
- [x] `secret-coverage scan --ci` exits non-zero on critical findings.
- [x] Findings are deterministic; no LLM is used for detection.
- [x] Every finding includes severity, type, variable, message, and recommendation when useful.
- [x] Default output is low-noise and actionable.

### Security / Trust DoD

- [x] Secret values never leave the user's machine, CI runner, or GitHub Action environment.
- [x] Reports include variable names, existence, references, files, finding types, and recommendations only.
- [x] Reports never include raw `.env` contents, API keys, tokens, passwords, certificates, database credentials, JWT secrets, or raw env values.
- [x] Plaintext-secret findings mention variable name and file only; never print the value.
- [x] Documentation clearly positions Secret Coverage as metadata-only deployment readiness tooling, not secrets management.
- [x] Future cloud features, if any, accept metadata/fingerprints only and never raw secret values.

### Detection DoD

MVP supported implementation scope:

- [x] Parses `.env.example`, `.env`, `.env.local`, `.env.production`, `.env.development`.
- [x] Detects references in GitHub Actions workflows.
- [x] Detects references in GitLab CI/CD config.
- [x] Detects references in CircleCI config.
- [x] Detects references in Dockerfile and Docker Compose.
- [x] Detects references in Vercel config via static heuristics.
- [x] Detects referenced-but-missing-from-example variables.
- [x] Detects likely plaintext secrets in committed env files.
- [x] Detects local variables not documented in `.env.example`.
- [x] Suppresses common false positives like `PATH`, `HOME`, `CI`, `GITHUB_TOKEN`.

Roadmap visibility but not MVP implementation complexity:

- Jenkins, Kubernetes, Terraform, AWS Secrets Manager, Azure Key Vault, Hashicorp Vault, CapRover, Coolify, Fly.io, Firebase, Supabase/Railway/Render API integrations.

### Engineering DoD

- [x] Tests are written before behavior changes where practical.
- [x] `pnpm test` passes.
- [x] `pnpm build` passes.
- [x] CLI smoke test passes on at least one fixture repo.
- [x] No TypeScript `any` for core model paths unless explicitly justified.
- [x] Repository has useful examples and sample reports.
- [x] Keep dependencies minimal.

### GitHub Action DoD

- [x] `action.yml` runs the built CLI.
- [x] README contains copy-paste GitHub Action example.
- [x] Action can produce Markdown summary in CI logs.
- [x] Release instructions explain that `dist/` must be built before tagging.

### Documentation / Growth DoD

- [x] README explains problem, install, CLI examples, CI examples, MVP supported platforms, planned integrations, output examples, limitations, and GEO/LLM discoverability positioning.
- [x] `docs/installation.md` exists.
- [x] `docs/roadmap.md` exists.
- [x] `docs/roadmap/` and `docs/integrations/` exist with future platform support plans.
- [x] `docs/seo-ideas.md` contains 20 concrete developer-search article ideas.
- [x] `docs/landing-page-copy.md` exists with practical landing copy.
- [x] `examples/sample-report.md` and `examples/sample-report.json` exist.

### Release DoD

- [x] Version is `0.1.0`.
- [x] `pnpm test && pnpm build` passes cleanly.
- [x] `node dist/cli.js scan --path examples/fixtures/broken-app --ci` returns non-zero with expected findings.
- [x] `node dist/cli.js scan --path examples/fixtures/clean-app --ci` returns zero.
- [x] Release notes clearly state supported scanners and known limitations.

---

## Execution Cadence

Work in small increments. Each heartbeat should do at most one coherent slice:

1. Inspect current repo status and last plan item.
2. Pick the highest-leverage unfinished task.
3. Implement using TDD where code behavior changes.
4. Run targeted tests, then full tests/build when relevant.
5. Update this plan or `docs/progress.md` with status, blockers, next step.
6. Report concise status to Darius only when there is meaningful progress or a blocker.

---

## Task Backlog

### Task 1: Stabilize current TypeScript implementation

**Objective:** Make the current source compile and tests pass.

**Files:**
- Modify: `src/**/*.ts`
- Modify if needed: `tests/scanner.test.ts`

**Steps:**
1. Run `pnpm test`.
2. Fix only compile/runtime errors needed for current tests.
3. Run `pnpm test` again.
4. Run `pnpm build`.
5. Commit or record progress.

**Verification:** `pnpm test && pnpm build` passes.

### Task 2: Add fixture-based CLI smoke tests

**Objective:** Prove CLI behavior for broken and clean repositories.

**Files:**
- Create: `examples/fixtures/broken-app/*`
- Create: `examples/fixtures/clean-app/*`
- Create/modify: `tests/cli.test.ts`

**Verification:** tests check exit code and output for both fixture apps.

### Task 3: Improve env reference extraction precision

**Objective:** Reduce false positives in shell/YAML/JS env detection.

**Files:**
- Modify: `src/parsers/env.ts`
- Test: `tests/parser.test.ts`

**Verification:** parser tests cover `process.env.X`, `${X}`, `$X`, `${{ secrets.X }}`, and ignored built-ins.

### Task 4: Improve scanner normalization

**Objective:** Make each platform scanner isolated and predictable.

**Files:**
- Modify: `src/scanners/*.ts`
- Test: `tests/scanners/*.test.ts` or consolidated tests.

**Verification:** each scanner has at least one platform-specific test.

### Task 5: Harden finding model and scoring

**Objective:** Make findings stable for JSON consumers and human-readable for Markdown.

**Files:**
- Modify: `src/types.ts`
- Modify: `src/engine.ts`
- Modify: `src/formatters.ts`

**Verification:** snapshot or explicit tests for JSON and Markdown output.

### Task 6: Build documentation package

**Objective:** Create the public-facing docs required for v0.1.0.

**Files:**
- Create/modify: `README.md`
- Create: `docs/installation.md`
- Create: `docs/roadmap.md`
- Create: `docs/seo-ideas.md`
- Create: `docs/landing-page-copy.md`
- Create: `examples/sample-report.md`
- Create: `examples/sample-report.json`

**Verification:** all examples reference real commands supported by the CLI.

### Task 7: GitHub Action release path

**Objective:** Make the GitHub Action usable from a public repo.

**Files:**
- Modify: `action.yml`
- Create/modify: `.github/workflows/test.yml`
- Modify: `README.md`

**Verification:** local build produces `dist/cli.js`; README shows valid usage.

### Task 8: First release checklist

**Objective:** Prepare but do not publish until Darius approves.

**Files:**
- Create: `RELEASE.md`
- Create: `CHANGELOG.md`

**Verification:** release checklist references exact commands and known limitations.

---

## Non-Goals For Now

- No cloud dashboard.
- No paid infra.
- No secret storage.
- No Slack alerting product feature.
- No enterprise policy engine.
- No AI-based detection.

---

## Heartbeat Review Questions

At every heartbeat, answer internally:

1. What is the smallest useful thing to ship next?
2. What is most likely to reduce developer trust if wrong?
3. Are tests proving the behavior or just the implementation?
4. Is the output actionable for a tired developer during deployment?
5. Is scope creeping beyond deterministic local-first scanning?
