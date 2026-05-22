import { describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scanProject } from '../src/index.js';

function fixture(files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), 'secret-coverage-engine-'));
  for (const [relative, content] of Object.entries(files)) {
    const full = join(dir, relative);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, content);
  }
  return dir;
}

describe('scanProject engine stability', () => {
  it('returns findings in stable severity, variable, type, and file order', async () => {
    const root = fixture({
      '.env.example': 'OPTIONAL_ONLY=\nZ_SECRET=\n',
      '.env.local': 'Z_UNUSED=debug\nOPTIONAL_ONLY=ok\nZ_SECRET=sk_live_1234567890abcdef\n',
      '.github/workflows/deploy.yml': 'name: deploy\njobs:\n  deploy:\n    env:\n      B_SECRET: ${{ secrets.B_SECRET }}\n      A_SECRET: ${{ secrets.A_SECRET }}\n',
    });

    const result = await scanProject(root);

    expect(result.findings.map(finding => `${finding.severity}:${finding.variable}:${finding.type}:${finding.file ?? ''}`)).toEqual([
      'critical:A_SECRET:missing-from-template:.github/workflows/deploy.yml',
      'critical:B_SECRET:missing-from-template:.github/workflows/deploy.yml',
      'critical:Z_SECRET:plaintext-secret:.env.local',
      'warning:Z_UNUSED:unused-local-variable:',
    ]);
  });

  it('deduplicates repeated references and keeps readiness score inside 0-100', async () => {
    const root = fixture({
      '.env.example': '',
      'Dockerfile': Array.from({ length: 8 }, (_, index) => `RUN echo $MISSING_${index}`).join('\n'),
      'docker-compose.yml': Array.from({ length: 8 }, (_, index) => `  MISSING_${index}: $MISSING_${index}`).join('\n'),
    });

    const result = await scanProject(root);

    expect(result.summary.critical).toBe(16);
    expect(result.summary.readinessScore).toBe(0);
    expect(new Set(result.findings.map(finding => `${finding.variable}:${finding.file ?? ''}`)).size).toBe(result.findings.length);
  });
});
