import { describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scanProject } from '../src/index.js';

function fixture(files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), 'envguard-'));
  for (const [relative, content] of Object.entries(files)) {
    const full = join(dir, relative);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, content);
  }
  return dir;
}

describe('scanProject', () => {
  it('reports variables referenced in GitHub Actions but missing from .env.example', async () => {
    const root = fixture({
      '.env.example': 'DATABASE_URL=\n',
      '.github/workflows/deploy.yml': 'name: deploy\njobs:\n  deploy:\n    runs-on: ubuntu-latest\n    env:\n      NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}\n',
    });

    const result = await scanProject(root);

    expect(result.findings).toContainEqual(expect.objectContaining({
      severity: 'critical',
      type: 'missing-from-example',
      variable: 'NEXT_PUBLIC_API_URL',
    }));
  });

  it('reports unused local variables as warnings', async () => {
    const root = fixture({
      '.env.example': 'DATABASE_URL=\n',
      '.env.local': 'DATABASE_URL=postgres://example\nSUPABASE_SERVICE_ROLE_KEY=secret\n',
    });

    const result = await scanProject(root);

    expect(result.findings).toContainEqual(expect.objectContaining({
      severity: 'warning',
      type: 'unused-local-variable',
      variable: 'SUPABASE_SERVICE_ROLE_KEY',
    }));
  });

  it('reports plaintext secrets committed to local env files', async () => {
    const root = fixture({
      '.env.example': 'STRIPE_SECRET_KEY=\n',
      '.env.local': 'STRIPE_SECRET_KEY=sk_live_1234567890abcdef\n',
    });

    const result = await scanProject(root);

    expect(result.findings).toContainEqual(expect.objectContaining({
      severity: 'critical',
      type: 'plaintext-secret',
      variable: 'STRIPE_SECRET_KEY',
    }));
  });

  it('calculates a readiness score below 100 when blockers exist', async () => {
    const root = fixture({
      '.env.example': '',
      'Dockerfile': 'ENV DATABASE_URL=${DATABASE_URL}\n',
    });

    const result = await scanProject(root);

    expect(result.summary.readinessScore).toBeLessThan(100);
    expect(result.summary.critical).toBeGreaterThan(0);
  });
});
