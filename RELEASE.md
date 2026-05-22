# Release Checklist

## v0.1.0 pre-release

- [ ] `pnpm install`
- [ ] `pnpm test`
- [ ] `pnpm build`
- [ ] `node dist/cli.js scan --path examples/fixtures/broken-app --ci` exits non-zero
- [ ] `node dist/cli.js scan --path examples/fixtures/clean-app --ci` exits zero
- [ ] README examples match real CLI behavior
- [ ] `action.yml` points to built `dist/cli.js`
- [ ] `dist/cli.js` and other `dist/` files are generated from the current TypeScript source
- [ ] Darius approves publishing target and repository name

## Publishing gate

Secret Coverage is not approved for external publishing yet.

- Do not publish to npm without explicit Darius approval.
- Do not create a GitHub release without explicit Darius approval.
- dist/cli.js must be built before tagging because the GitHub Action executes the built CLI.
- Confirm package/repository names before replacing `leviro-ai/secret-coverage@v0.1.0` examples.

## Known limitations to disclose

- Static deterministic scanning only.
- No remote secret verification yet.
- No cloud dashboard.
- Does not store or manage secrets.
- Deterministic heuristics may miss dynamically generated environment variable names.
