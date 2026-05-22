import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function packageJson() {
  return JSON.parse(readFileSync('package.json', 'utf8')) as { scripts: Record<string, string> };
}

describe('quality and security gates', () => {
  it('exposes package scripts for typecheck, lint, dependency audit, package dry-run, and full quality gate', () => {
    const scripts = packageJson().scripts;

    expect(scripts.typecheck).toBe('tsc -p tsconfig.json --noEmit');
    expect(scripts.lint).toBe('pnpm typecheck');
    expect(scripts['security:audit']).toBe('pnpm audit --audit-level moderate');
    expect(scripts['package:check']).toBe('npm pack --dry-run');
    expect(scripts.quality).toBe('pnpm lint && pnpm test && pnpm build && pnpm security:audit && pnpm package:check');
  });

  it('runs quality gates in GitHub Actions before fixture smoke checks', () => {
    const workflow = readFileSync('.github/workflows/test.yml', 'utf8');

    const smokeCheckIndex = workflow.indexOf('- name: EnvGuard broken fixture should fail CI');
    for (const gate of ['- run: pnpm lint', '- run: pnpm test', '- run: pnpm build', '- run: pnpm security:audit', '- run: pnpm package:check']) {
      expect(workflow).toContain(gate);
      expect(workflow.indexOf(gate)).toBeLessThan(smokeCheckIndex);
    }
  });

  it('shows CI, package, license, TypeScript, and local-first trust badges in the README', () => {
    const readme = readFileSync('README.md', 'utf8');

    expect(readme).toContain('![CI](https://github.com/dariuskasperavicius/secret-coverage-checker/actions/workflows/test.yml/badge.svg)');
    expect(readme).toContain('![npm package](https://img.shields.io/badge/npm-pre--release-orange)');
    expect(readme).toContain('![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)');
    expect(readme).toContain('![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)');
    expect(readme).toContain('![Local first](https://img.shields.io/badge/local--first-no_cloud_required-brightgreen)');
  });
});
