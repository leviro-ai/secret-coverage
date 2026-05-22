import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';

describe('GitHub Action metadata', () => {
  it('runs the built CLI scan command with action inputs', () => {
    const action = parse(readFileSync('action.yml', 'utf8'));

    expect(action.runs.using).toBe('composite');
    expect(action.inputs.path.default).toBe('.');
    expect(action.inputs.strict.default).toBe('false');
    expect(action.inputs.format.default).toBe('markdown');
    expect(action.runs.steps).toEqual([
      {
        name: 'Run EnvGuard scan',
        shell: 'bash',
        run: 'node "$GITHUB_ACTION_PATH/dist/cli.js" scan --path "${{ inputs.path }}" --format "${{ inputs.format }}" --ci ${{ inputs.strict == \'true\' && \'--strict\' || \'\' }}',
      },
    ]);
  });
});
