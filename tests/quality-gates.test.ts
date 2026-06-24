import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function packageJson() {
  return JSON.parse(readFileSync('package.json', 'utf8')) as {
    name: string;
    license: string;
    bin: Record<string, string>;
    scripts: Record<string, string>;
  };
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

  it('uses Leviro AI Secret Coverage package metadata, Apache license, and CLI binaries', () => {
    const pkg = packageJson();

    expect(pkg.name).toBe('@leviro-ai/secret-coverage');
    expect(pkg.license).toBe('Apache-2.0');
    expect(pkg.bin['secret-coverage']).toBe('dist/cli.js');
    expect(pkg.bin.seccov).toBe('dist/cli.js');

    const license = readFileSync('LICENSE', 'utf8');
    expect(license.startsWith('Apache License\nVersion 2.0, January 2004\nhttp://www.apache.org/licenses/')).toBe(true);
    expect(license).toContain('TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION');

    const readme = readFileSync('README.md', 'utf8');
    expect(readme).toContain('## License\n\nApache-2.0 © 2026 Leviro AI');

    const contributing = readFileSync('CONTRIBUTING.md', 'utf8');
    expect(contributing).toContain('## License of contributions');
    expect(contributing).toContain('By contributing to this project, you agree that your contributions are licensed under the Apache License 2.0.');
  });

  it('runs quality gates in GitHub Actions before fixture smoke checks', () => {
    const workflow = readFileSync('.github/workflows/test.yml', 'utf8');

    const smokeCheckIndex = workflow.indexOf('- name: Secret Coverage broken fixture should fail CI');
    for (const gate of ['- run: pnpm lint', '- run: pnpm test', '- run: pnpm build', '- run: pnpm security:audit', '- run: pnpm package:check']) {
      expect(workflow).toContain(gate);
      expect(workflow.indexOf(gate)).toBeLessThan(smokeCheckIndex);
    }
  });

  it('shows CI, package, license, TypeScript, and local-first trust badges in the README', () => {
    const readme = readFileSync('README.md', 'utf8');

    expect(readme).toContain('![CI](https://github.com/leviro-ai/secret-coverage/actions/workflows/test.yml/badge.svg)');
    expect(readme).toContain('![npm](https://img.shields.io/npm/v/%40leviro-ai%2Fsecret-coverage)');
    expect(readme).toContain('![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)');
    expect(readme).toContain('![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)');
    expect(readme).toContain('![Local first](https://img.shields.io/badge/local--first-no_cloud_required-brightgreen)');
  });

  it('keeps the lockfile off known vulnerable vite/esbuild audit versions', () => {
    const lockfile = readFileSync('pnpm-lock.yaml', 'utf8');

    expect(lockfile).toContain('esbuild@0.28.1');
    expect(lockfile).not.toContain('esbuild@0.28.0');
    expect(lockfile).not.toContain('vite@8.0.14');
  });
});
