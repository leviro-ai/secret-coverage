import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';

describe('GitHub Action metadata', () => {
  it('runs the built CLI scan command with action inputs and writes markdown summaries', () => {
    const action = parse(readFileSync('action.yml', 'utf8'));

    expect(action.runs.using).toBe('composite');
    expect(action.inputs.path.default).toBe('.');
    expect(action.inputs.strict.default).toBe('false');
    expect(action.inputs.format.default).toBe('markdown');

    const [step] = action.runs.steps;
    expect(step.name).toBe('Run EnvGuard scan');
    expect(step.shell).toBe('bash');
    expect(step.env).toEqual({
      ENVGUARD_FORMAT: '${{ inputs.format }}',
      ENVGUARD_PATH: '${{ inputs.path }}',
      ENVGUARD_STRICT: '${{ inputs.strict }}',
    });
    expect(step.run).toContain('args=(scan --path "$ENVGUARD_PATH" --format "$ENVGUARD_FORMAT" --ci)');
    expect(step.run).toContain('args+=(--strict)');
    expect(step.run).toContain('node "$GITHUB_ACTION_PATH/dist/cli.js" "${args[@]}"');
    expect(step.run).toContain('## EnvGuard report');
    expect(step.run).toContain('>> "$GITHUB_STEP_SUMMARY"');
    expect(step.run).toContain('exit "$status"');
  });
});
