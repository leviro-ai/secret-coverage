import { describe, expect, it } from 'vitest';
import { formatJson, formatMarkdown } from '../src/formatters.js';
import type { ScanResult } from '../src/types.js';

const result: ScanResult = {
  summary: { critical: 1, warning: 1, info: 1, readinessScore: 65 },
  findings: [
    {
      severity: 'info',
      type: 'declared-not-local',
      variable: 'DATABASE_URL',
      message: 'DATABASE_URL is documented but not present locally.',
      recommendation: 'Set DATABASE_URL locally before building.',
    },
    {
      severity: 'critical',
      type: 'missing-from-example',
      variable: 'NEXT_PUBLIC_API_URL',
      file: '.github/workflows/deploy.yml',
      message: 'NEXT_PUBLIC_API_URL is used in deploy workflow but missing from .env.example.',
      recommendation: 'Add NEXT_PUBLIC_API_URL= to .env.example.',
    },
    {
      severity: 'warning',
      type: 'unused-local-variable',
      variable: 'SUPABASE_SERVICE_ROLE_KEY',
      file: '.env.local',
      message: 'SUPABASE_SERVICE_ROLE_KEY exists locally but is not referenced.',
      recommendation: 'Remove it or document it in .env.example.',
    },
  ],
  declared: [],
  referenced: [],
};

describe('formatJson', () => {
  it('prints stable sorted findings for machine consumers', () => {
    const parsed = JSON.parse(formatJson(result));

    expect(parsed.findings.map((finding: { variable: string }) => finding.variable)).toEqual([
      'NEXT_PUBLIC_API_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'DATABASE_URL',
    ]);
    expect(parsed.summary).toEqual({ critical: 1, warning: 1, info: 1, readinessScore: 65 });
  });

  it('omits raw declared environment values from JSON reports', () => {
    const parsed = JSON.parse(formatJson({
      ...result,
      declared: [
        { variable: 'STRIPE_SECRET_KEY', value: 'sk_live_should_never_print', file: '.env.local', source: '.env.local' },
      ],
    }));

    expect(JSON.stringify(parsed)).not.toContain('sk_live_should_never_print');
    expect(parsed.declared).toEqual([
      { variable: 'STRIPE_SECRET_KEY', file: '.env.local', source: '.env.local' },
    ]);
  });
});

describe('formatMarkdown', () => {
  it('prints concise severity sections with file/type context and fixes', () => {
    const markdown = formatMarkdown(result);

    expect(markdown).toContain('Readiness score: **65/100**');
    expect(markdown.indexOf('## Critical')).toBeLessThan(markdown.indexOf('## Warning'));
    expect(markdown.indexOf('## Warning')).toBeLessThan(markdown.indexOf('## Info'));
    expect(markdown).toContain('**NEXT_PUBLIC_API_URL** — NEXT_PUBLIC_API_URL is used in deploy workflow but missing from .env.example.');
    expect(markdown).toContain('  - Context: `.github/workflows/deploy.yml` · `missing-from-example`');
    expect(markdown).toContain('  - Fix: Add NEXT_PUBLIC_API_URL= to .env.example.');
  });

  it('prints a positive no-findings message', () => {
    const clean: ScanResult = {
      summary: { critical: 0, warning: 0, info: 0, readinessScore: 100 },
      findings: [],
      declared: [],
      referenced: [],
    };

    expect(formatMarkdown(clean)).toContain('✅ No deployment-blocking environment variable issues detected.');
  });
});
