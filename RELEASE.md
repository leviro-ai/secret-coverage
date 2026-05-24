# Release Checklist

## v0.1.0 pre-release

- [ ] `pnpm install`
- [ ] `pnpm test`
- [ ] `pnpm build`
- [ ] `node dist/cli.js scan --path examples/fixtures/broken-app --ci` exits non-zero
- [ ] `node dist/cli.js scan --path examples/fixtures/clean-app --ci` exits zero
- [ ] README examples match real CLI behavior
- [ ] `action.yml` runs the pinned published npm CLI package for this release version
- [ ] GitHub Action examples use the current stable `vX.Y.Z` tag
- [ ] Darius approves publishing target and repository name

## Publishing gate

- Publish to npm only with explicit Darius approval.
- Create a GitHub release only with explicit Darius approval.
- Publish to GitHub Marketplace only after a tagged action has been verified from a clean workflow/repo.
- Confirm package/repository names before changing stable `leviro-ai/secret-coverage@vX.Y.Z` examples.

## Known limitations to disclose

- Static deterministic scanning only.
- No remote secret verification yet.
- No cloud dashboard.
- Does not store or manage secrets.
- Deterministic heuristics may miss dynamically generated environment variable names.
