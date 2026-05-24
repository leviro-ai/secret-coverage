import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';

type WorkflowStep = {
  uses?: string;
  with?: Record<string, unknown>;
};

describe('GitHub Action metadata', () => {
  it('runs the built CLI scan command with action inputs and writes markdown summaries', () => {
    const action = parse(readFileSync('action.yml', 'utf8'));
    const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { name: string; version: string };

    expect(action.runs.using).toBe('composite');
    expect(action.inputs.path.default).toBe('.');
    expect(action.inputs.strict.default).toBe('false');
    expect(action.inputs.format.default).toBe('markdown');

    expect(action.name).toBe('Secret Coverage');
    expect(action.author).toBe('Leviro AI');

    const [step] = action.runs.steps;
    expect(step.name).toBe('Run Secret Coverage scan');
    expect(step.shell).toBe('bash');
    expect(step.env).toEqual({
      SECRET_COVERAGE_FORMAT: '${{ inputs.format }}',
      SECRET_COVERAGE_PATH: '${{ inputs.path }}',
      SECRET_COVERAGE_STRICT: '${{ inputs.strict }}',
    });
    expect(step.run).toContain('args=(scan --path "$SECRET_COVERAGE_PATH" --format "$SECRET_COVERAGE_FORMAT" --ci)');
    expect(step.run).toContain('args+=(--strict)');
    expect(step.run).toContain(
      `npx --yes --package "${pkg.name}@${pkg.version}" secret-coverage ` + '"${args[@]}"',
    );
    expect(step.run).not.toContain('node "$GITHUB_ACTION_PATH/dist/cli.js"');
    expect(step.run).toContain('## Secret Coverage report');
    expect(step.run).toContain('>> "$GITHUB_STEP_SUMMARY"');
    expect(step.run).toContain('exit "$status"');
  });

  it('uses current Node-based workflow actions to avoid upstream Node.js 20 deprecation annotations', () => {
    const workflow = parse(readFileSync('.github/workflows/test.yml', 'utf8')) as {
      jobs: { test: { steps: WorkflowStep[] } };
    };

    const uses = workflow.jobs.test.steps.map((step) => step.uses).filter(Boolean);
    expect(uses).toContain('actions/checkout@v6');
    expect(uses).toContain('pnpm/action-setup@v6');
    expect(uses).toContain('actions/setup-node@v6');
    expect(uses).not.toContain('actions/checkout@v4');
    expect(uses).not.toContain('pnpm/action-setup@v4');
    expect(uses).not.toContain('actions/setup-node@v4');

    const setupNode = workflow.jobs.test.steps.find((step) => step.uses === 'actions/setup-node@v6');
    expect(setupNode?.with).toMatchObject({
      'node-version': 20,
      cache: 'pnpm',
    });
  });
});
