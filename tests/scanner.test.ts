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
  it('reports variables referenced in GitHub Actions but missing from the env template', async () => {
    const root = fixture({
      '.env.example': 'DATABASE_URL=\n',
      '.github/workflows/deploy.yml': 'name: deploy\njobs:\n  deploy:\n    runs-on: ubuntu-latest\n    env:\n      NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}\n',
    });

    const result = await scanProject(root);

    expect(result.findings).toContainEqual(expect.objectContaining({
      severity: 'critical',
      type: 'missing-from-template',
      variable: 'NEXT_PUBLIC_API_URL',
    }));
  });

  it('treats .env.dist as a default env template', async () => {
    const root = fixture({
      '.env.dist': 'NEXT_PUBLIC_API_URL=\n',
      '.github/workflows/deploy.yml': 'name: deploy\njobs:\n  deploy:\n    runs-on: ubuntu-latest\n    env:\n      NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}\n',
    });

    const result = await scanProject(root);

    expect(result.summary.critical).toBe(0);
    expect(result.declared).toContainEqual(expect.objectContaining({
      variable: 'NEXT_PUBLIC_API_URL',
      file: '.env.dist',
      source: '.env.dist',
    }));
    expect(result.findings).not.toContainEqual(expect.objectContaining({
      type: 'missing-from-template',
      variable: 'NEXT_PUBLIC_API_URL',
    }));
  });

  it('uses an explicitly configured env template file', async () => {
    const root = fixture({
      'config/env.template': 'NEXT_PUBLIC_API_URL=\n',
      '.github/workflows/deploy.yml': 'name: deploy\njobs:\n  deploy:\n    runs-on: ubuntu-latest\n    env:\n      NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}\n',
    });

    const result = await scanProject(root, { envTemplate: 'config/env.template' });

    expect(result.summary.critical).toBe(0);
    expect(result.declared).toContainEqual(expect.objectContaining({
      variable: 'NEXT_PUBLIC_API_URL',
      file: 'config/env.template',
      source: 'config/env.template',
    }));
  });

  it('only reads the explicitly configured env template and does not scan .env.local', async () => {
    const root = fixture({
      '.env.dist': 'NEXT_PUBLIC_API_URL=\n',
      '.env.local': 'STRIPE_CHECKOUT_PRICE_ID=sk_live_this_should_not_be_reported\nLOCAL_ONLY=value\n',
      '.github/workflows/deploy.yml': 'name: deploy\njobs:\n  deploy:\n    runs-on: ubuntu-latest\n    env:\n      NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}\n',
    });

    const result = await scanProject(root, { envTemplate: '.env.dist' });

    expect(result.declared).toEqual([
      expect.objectContaining({ variable: 'NEXT_PUBLIC_API_URL', file: '.env.dist', source: '.env.dist' }),
    ]);
    expect(result.findings).not.toContainEqual(expect.objectContaining({
      type: 'plaintext-secret',
      variable: 'STRIPE_CHECKOUT_PRICE_ID',
      file: '.env.local',
    }));
    expect(result.findings).not.toContainEqual(expect.objectContaining({
      type: 'unused-local-variable',
      variable: 'LOCAL_ONLY',
    }));
    expect(result.findings).not.toContainEqual(expect.objectContaining({
      type: 'declared-not-local',
      variable: 'NEXT_PUBLIC_API_URL',
    }));
    expect(result.summary.info).toBe(0);
  });

  it('returns a notice when no searched env files exist', async () => {
    const root = fixture({
      '.github/workflows/deploy.yml': 'name: deploy\njobs:\n  deploy:\n    runs-on: ubuntu-latest\n    env:\n      NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}\n',
    });

    const result = await scanProject(root);

    expect(result.notices).toContain('No env files found. EnvGuard looked for: .env.example, .env.dist, .env, .env.local, .env.production, .env.development. Use --env-template <file> if your repo uses a different template filename.');
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
