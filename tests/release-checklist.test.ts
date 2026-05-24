import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';
import { describe, expect, it } from 'vitest';

const releaseCommands = [
  'pnpm test',
  'pnpm build',
  'node dist/cli.js scan --path examples/fixtures/broken-app --ci',
  'node dist/cli.js scan --path examples/fixtures/clean-app --ci',
];

describe('release checklist', () => {
  it('keeps current release checks explicit and approval-gated', () => {
    const release = readFileSync('RELEASE.md', 'utf8');
    const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as {
      name: string;
      version: string;
      description: string;
      files: string[];
      bin: Record<string, string>;
      engines: Record<string, string>;
      license: string;
    };

    expect(pkg.name).toBe('@leviro-ai/secret-coverage');
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(pkg.description).toBe('Detect missing environment variables before your deployment fails.');
    expect(pkg.license).toBe('Apache-2.0');
    expect(pkg.engines.node).toBe('>=20');
    expect(pkg.bin['secret-coverage']).toBe('dist/cli.js');
    expect(pkg.bin.seccov).toBe('dist/cli.js');
    expect(pkg.files).toContain('dist');
    expect(pkg.files).toContain('action.yml');
    expect(pkg.files).toContain('CHANGELOG.md');
    expect(pkg.files).toContain('LICENSE');

    for (const command of releaseCommands) {
      expect(release).toContain(command);
    }

    expect(release).toContain('Publish to npm only with explicit Darius approval');
    expect(release).toContain('Create a GitHub release only with explicit Darius approval');
    expect(release).toContain('Publish to GitHub Marketplace only after a tagged action has been verified');
    expect(release).toContain('`action.yml` runs the pinned published npm CLI package');
    expect(release).toContain('GitHub Action examples use the current stable');
  });

  it('keeps GitHub Action metadata aligned with the package identity and built CLI', () => {
    const action = parseYaml(readFileSync('action.yml', 'utf8')) as {
      name: string;
      description: string;
      author: string;
      runs: { using: string; steps: Array<{ run?: string }> };
      branding: { icon: string; color: string };
    };

    expect(action.name).toBe('Secret Coverage');
    expect(action.description).toBe('Detect missing environment variables before your deployment fails.');
    expect(action.author).toBe('Leviro AI');
    const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { name: string; version: string };
    const runScript = action.runs.steps.map(step => step.run ?? '').join('\n');

    expect(action.runs.using).toBe('composite');
    expect(runScript).toContain(`--package "${pkg.name}@${pkg.version}"`);
    expect(runScript).toContain('secret-coverage "${args[@]}"');
    expect(runScript).not.toContain('$GITHUB_ACTION_PATH/dist/cli.js');
    expect(action.branding).toEqual({ icon: 'shield', color: 'green' });
  });

  it(
    'keeps the built CLI executable for direct npm bin and GitHub Action use',
    () => {
      execFileSync('pnpm', ['build'], { cwd: process.cwd(), stdio: 'pipe' });
      expect(existsSync('dist/cli.js')).toBe(true);
      expect(readFileSync('dist/cli.js', 'utf8').split('\n')[0]).toBe('#!/usr/bin/env node');
    },
    15000,
  );

  it('keeps changelog aligned with v0.1.0 supported scanners and trust posture', () => {
    const changelog = readFileSync('CHANGELOG.md', 'utf8');

    expect(changelog).toContain('GitHub Actions');
    expect(changelog).toContain('GitLab CI/CD');
    expect(changelog).toContain('CircleCI');
    expect(changelog).toContain('Docker');
    expect(changelog).toContain('Vercel');
    expect(changelog).toContain('metadata-only');
    const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { version: string };

    expect(changelog).toContain(`## ${pkg.version}`);
    expect(changelog).toContain('no raw secret values');
  });
});
