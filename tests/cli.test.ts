import { describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join } from 'node:path';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

const execFileAsync = promisify(execFile);
const cli = join(process.cwd(), 'src/cli.ts');
const tsx = join(process.cwd(), 'node_modules/.bin/tsx');

function warningOnlyFixture() {
  const dir = mkdtempSync(join(tmpdir(), 'secret-coverage-cli-warning-'));
  writeFileSync(join(dir, '.env.local'), 'LOCAL_ONLY=value\n');
  writeFileSync(join(dir, '.env.example'), '');
  return dir;
}

function secretFixture() {
  const dir = mkdtempSync(join(tmpdir(), 'secret-coverage-cli-secret-'));
  writeFileSync(join(dir, '.env.example'), 'STRIPE_SECRET_KEY=\n');
  writeFileSync(join(dir, '.env.local'), 'STRIPE_SECRET_KEY=sk_live_should_never_print\n');
  return dir;
}

async function runCli(args: string[]) {
  try {
    const result = await execFileAsync(tsx, [cli, ...args], { cwd: process.cwd() });
    return { code: 0, stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    const err = error as { code?: number; stdout?: string; stderr?: string };
    return { code: err.code ?? 1, stdout: err.stdout ?? '', stderr: err.stderr ?? '' };
  }
}

describe('Secret Coverage CLI', () => {
  it('prints the renamed CLI help', async () => {
    const result = await runCli(['--help']);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('Usage: secret-coverage');
    expect(result.stdout).toContain('Environment Secret Coverage Checker');
  });

  it('exits non-zero in CI mode for a broken fixture', async () => {
    const result = await runCli(['scan', '--path', 'examples/fixtures/broken-app', '--ci']);

    expect(result.code).toBe(1);
    expect(result.stdout).toContain('NEXT_PUBLIC_API_URL');
    expect(result.stdout).toContain('missing from an env template');
  });

  it('honors options passed through pnpm scan -- without scanning the Secret Coverage source tree', async () => {
    let result: { code?: number; stdout?: string; stderr?: string };
    try {
      const output = await execFileAsync('pnpm', ['scan', '--', '--path', 'examples/fixtures/broken-app', '--ci'], { cwd: process.cwd() });
      result = { code: 0, stdout: output.stdout, stderr: output.stderr };
    } catch (error) {
      const err = error as { code?: number; stdout?: string; stderr?: string };
      result = { code: err.code ?? 1, stdout: err.stdout ?? '', stderr: err.stderr ?? '' };
    }

    expect(result.code).toBe(1);
    expect(result.stdout).toContain('NEXT_PUBLIC_API_URL');
    expect(result.stdout).not.toContain('**js**');
    expect(result.stdout).not.toContain('**context**');
    expect(result.stdout).not.toContain('src/scanners');
  });

  it('exits zero in CI mode for a clean fixture', async () => {
    const result = await runCli(['scan', '--path', 'examples/fixtures/clean-app', '--ci']);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('No deployment-blocking environment variable issues detected');
  });

  it('prints stable JSON with --json', async () => {
    const result = await runCli(['scan', '--path', 'examples/fixtures/broken-app', '--json']);

    expect(result.code).toBe(0);
    const parsed = JSON.parse(result.stdout);
    expect(parsed.summary.critical).toBeGreaterThan(0);
    const finding = parsed.findings.find((item: { variable: string }) => item.variable === 'NEXT_PUBLIC_API_URL');
    expect(finding).toMatchObject({
      severity: 'critical',
      type: 'missing-from-template',
      variable: 'NEXT_PUBLIC_API_URL',
      file: '.github/workflows/deploy.yml',
    });
    expect(finding.message).toContain('NEXT_PUBLIC_API_URL');
    expect(finding.recommendation).toContain('Add NEXT_PUBLIC_API_URL=');
    expect(Object.keys(finding)).toEqual(['severity', 'type', 'variable', 'file', 'message', 'recommendation']);
  });

  it('supports an explicit env template file', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'secret-coverage-cli-template-'));
    writeFileSync(join(dir, 'env.dist'), 'DATABASE_URL=\n');
    writeFileSync(join(dir, 'Dockerfile'), 'ENV DATABASE_URL=${DATABASE_URL}\n');

    const result = await runCli(['scan', '--path', dir, '--env-template', 'env.dist', '--json']);

    expect(result.code).toBe(0);
    expect(JSON.parse(result.stdout).summary.critical).toBe(0);
  });

  it('does not scan .env.local when an explicit env template is provided', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'secret-coverage-cli-explicit-template-only-'));
    writeFileSync(join(dir, '.env.dist'), 'DATABASE_URL=\n');
    writeFileSync(join(dir, '.env.local'), 'STRIPE_CHECKOUT_PRICE_ID=sk_live_this_should_not_be_reported\nLOCAL_ONLY=value\n');
    writeFileSync(join(dir, 'Dockerfile'), 'ENV DATABASE_URL=${DATABASE_URL}\n');

    const result = await runCli(['scan', '--path', dir, '--env-template', '.env.dist', '--json']);
    const parsed = JSON.parse(result.stdout);

    expect(result.code).toBe(0);
    expect(parsed.declared).toEqual([{ variable: 'DATABASE_URL', file: '.env.dist', source: '.env.dist' }]);
    expect(result.stdout).not.toContain('STRIPE_CHECKOUT_PRICE_ID');
    expect(result.stdout).not.toContain('.env.local');
    expect(result.stdout).not.toContain('LOCAL_ONLY');
    expect(parsed.summary.info).toBe(0);
  });

  it('prints a notice when no searched env files exist', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'secret-coverage-cli-no-env-'));
    writeFileSync(join(dir, 'Dockerfile'), 'ENV DATABASE_URL=${DATABASE_URL}\n');

    const result = await runCli(['scan', '--path', dir, '--format', 'markdown']);

    expect(result.stdout).toContain('## Notices');
    expect(result.stdout).toContain('No env files found. Secret Coverage looked for: .env.example, .env.dist');
  });

  it('keeps CI warning-only scans green but fails strict mode', async () => {
    const root = warningOnlyFixture();

    const ci = await runCli(['scan', '--path', root, '--ci']);
    const strict = await runCli(['scan', '--path', root, '--strict']);

    expect(ci.code).toBe(0);
    expect(ci.stdout).toContain('Warning: 1');
    expect(strict.code).toBe(1);
    expect(strict.stdout).toContain('LOCAL_ONLY');
  });

  it('never prints raw secret values in JSON or Markdown reports', async () => {
    const root = secretFixture();

    const json = await runCli(['scan', '--path', root, '--json']);
    const markdown = await runCli(['scan', '--path', root, '--format', 'markdown']);

    expect(json.stdout).toContain('STRIPE_SECRET_KEY');
    expect(markdown.stdout).toContain('STRIPE_SECRET_KEY');
    expect(json.stdout).not.toContain('sk_live_should_never_print');
    expect(markdown.stdout).not.toContain('sk_live_should_never_print');
    expect(JSON.parse(json.stdout).declared).toEqual([
      { variable: 'STRIPE_SECRET_KEY', file: '.env.example', source: '.env.example' },
      { variable: 'STRIPE_SECRET_KEY', file: '.env.local', source: '.env.local' },
    ]);
  });
});
