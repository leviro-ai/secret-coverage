import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
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
      version: string;
      files: string[];
      bin: Record<string, string>;
    };

    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(pkg.bin['secret-coverage']).toBe('dist/cli.js');
    expect(pkg.bin.seccov).toBe('dist/cli.js');
    expect(pkg.files).toContain('dist');
    expect(pkg.files).toContain('action.yml');
    expect(pkg.files).toContain('CHANGELOG.md');

    for (const command of releaseCommands) {
      expect(release).toContain(command);
    }

    expect(release).toContain('Do not publish to npm');
    expect(release).toContain('Do not create a GitHub release');
    expect(release).toContain('dist/cli.js must be built before tagging');
    expect(release).toContain('Darius approves publishing target and repository name');
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
