import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function runCli(args: string[]): string {
  return execFileSync('pnpm', ['tsx', 'src/cli.ts', ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
}

describe('sample reports', () => {
  it('keeps the Markdown sample report generated from the broken fixture', () => {
    const generated = runCli(['scan', '--path', 'examples/fixtures/broken-app', '--format', 'markdown']);
    const sample = readFileSync('examples/sample-report.md', 'utf8');

    expect(sample).toBe(generated);
  });

  it('keeps the JSON sample report generated from the broken fixture without raw env values', () => {
    const generated = runCli(['scan', '--path', 'examples/fixtures/broken-app', '--json']);
    const sample = readFileSync('examples/sample-report.json', 'utf8');

    expect(sample).toBe(generated);
    expect(sample).toContain('SUPABASE_SERVICE_ROLE_KEY');
    expect(sample).not.toContain('super-secret-service-role-token');
    expect(sample).not.toContain('postgres://localhost/example');
    expect(JSON.parse(sample).declared).toEqual([
      { variable: 'DATABASE_URL', file: '.env.example', source: '.env.example' },
      { variable: 'DATABASE_URL', file: '.env.local', source: '.env.local' },
      { variable: 'SUPABASE_SERVICE_ROLE_KEY', file: '.env.local', source: '.env.local' },
    ]);
  });
});
