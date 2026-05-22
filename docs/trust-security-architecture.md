# Trust, Security, Architecture, and Positioning

Developer trust is a foundational product requirement for EnvGuard.

EnvGuard operates near sensitive systems:

- CI/CD pipelines
- deployment systems
- infrastructure configuration
- environment variables
- secrets
- cloud credentials
- API keys
- production systems

If developers suspect EnvGuard can read, upload, or exfiltrate secrets, adoption will fail. EnvGuard must therefore be designed and communicated as a **local-first, zero-trust, metadata-only deployment readiness tool**.

## Product thesis

EnvGuard is **not**:

- a secret manager;
- a vault;
- a credential storage platform;
- a secret synchronization system;
- an enterprise IAM or compliance platform.

EnvGuard **is**:

- deployment readiness monitoring;
- configuration observability;
- environment drift detection;
- CI/CD consistency validation;
- deployment risk analysis;
- AI-generated deployment safety tooling, where AI helps explain/report but does not perform deterministic detection.

EnvGuard should help teams answer:

- Why did deploy fail?
- Which env vars are missing?
- Why does prod differ from stage?
- Which variables are referenced but undefined?
- Which AI-generated PR introduced deployment risk?
- Which secrets are drifting across environments?
- Which repositories are deployment-ready?

## Absolute security rule

> Secret values must never leave the user's machine, CI runner, or GitHub Action environment.

This is non-negotiable.

EnvGuard may analyze and report metadata only.

## Allowed data

EnvGuard may analyze and output:

```json
{
  "variable": "SUPABASE_URL",
  "exists_in_prod": true,
  "exists_in_stage": false,
  "referenced_in": [
    "next.config.js",
    ".github/workflows/deploy.yml"
  ]
}
```

Allowed categories:

- variable names;
- existence / non-existence;
- file references;
- environment mappings;
- drift metadata;
- hashes or fingerprints when needed;
- timestamps;
- configuration structure;
- usage relationships;
- severity, finding type, recommendation.

## Forbidden data

EnvGuard must never upload, transmit, store remotely, or include in generated reports:

- actual secret values;
- decrypted secrets;
- raw `.env` contents;
- API keys;
- database credentials;
- JWT secrets;
- tokens;
- passwords;
- certificates;
- raw environment variable values.

## Architecture implications

### CLI and GitHub Action

- Detection runs locally in the developer machine, CI runner, or GitHub Action environment.
- Markdown and JSON reports must avoid raw secret values.
- Secret-like findings should reference variable names and files only.
- If a plaintext secret is detected, the output should say that the variable appears to contain a real secret, but must not print the value.

### Future cloud features

If cloud monitoring is added later, it must remain metadata-only by design.

Allowed cloud payload examples:

- variable names;
- booleans like `exists_in_prod` / `exists_in_stage`;
- fingerprints/hashes for drift comparison;
- source file paths;
- finding types and severities.

Forbidden cloud payload examples:

- `.env` file contents;
- deployment secret values;
- runtime environment values;
- decrypted CI secrets;
- credentials of any kind.

## Product copy rules

Use language like:

- "metadata-only environment validation";
- "local-first deployment readiness checks";
- "secret values never leave your runner";
- "EnvGuard checks coverage and drift, not secret contents";
- "not a vault, not a secrets manager".

Avoid language like:

- "we sync your secrets";
- "manage credentials";
- "centralize secret values";
- "upload your environment";
- "AI reads your secrets".

## Implementation checklist

- [ ] No report prints raw env values.
- [ ] Plaintext-secret findings include variable name and file only.
- [ ] JSON output excludes raw values from findings.
- [ ] Any future cloud API accepts metadata only.
- [ ] README and docs clearly state local-first and metadata-only behavior.
- [ ] Tests cover that secret values are not printed in reports.
