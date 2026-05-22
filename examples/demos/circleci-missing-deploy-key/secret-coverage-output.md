# Secret Coverage Report

Readiness score: **75/100**

Critical: 1 · Warning: 0 · Info: 0

## Critical

- **DEPLOY_KEY** — DEPLOY_KEY is used in .circleci/config.yml but missing from an env template.
  - Context: `.circleci/config.yml` · `missing-from-template`
  - Fix: Add DEPLOY_KEY= to an env template and configure the value in your deployment environment.


Command exit code: 1
