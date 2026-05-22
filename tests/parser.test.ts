import { describe, expect, it } from 'vitest';
import { extractEnvReferences, parseEnv } from '../src/parsers/env.js';

describe('parseEnv', () => {
  it('parses exported env assignments and strips quotes', () => {
    expect(parseEnv('export DATABASE_URL="postgres://localhost"\nNEXT_PUBLIC_API_URL=https://example.com')).toEqual([
      { key: 'DATABASE_URL', value: 'postgres://localhost', line: 1 },
      { key: 'NEXT_PUBLIC_API_URL', value: 'https://example.com', line: 2 },
    ]);
  });
});

describe('extractEnvReferences', () => {
  it('extracts JavaScript process.env dot, optional-chain, and bracket references', () => {
    const refs = extractEnvReferences("const a = process.env.DATABASE_URL; const b = process.env['NEXT_PUBLIC_API_URL']; const c = process.env?.REDIS_URL;");

    expect(refs).toEqual(['DATABASE_URL', 'NEXT_PUBLIC_API_URL', 'REDIS_URL']);
  });

  it('extracts shell braced and bare dollar references', () => {
    const refs = extractEnvReferences('docker run -e DATABASE_URL=${DATABASE_URL} -e REDIS_URL=$REDIS_URL');

    expect(refs).toEqual(['DATABASE_URL', 'REDIS_URL']);
  });

  it('does not treat JavaScript template interpolation identifiers as env references', () => {
    const refs = extractEnvReferences('const msg = `${context}:${eventName}:${checkoutSessionPlaceholder}:${process.env.STRIPE_SECRET_KEY}`;');

    expect(refs).toEqual(['STRIPE_SECRET_KEY']);
  });

  it('extracts GitHub Actions secrets and env expression references', () => {
    const refs = extractEnvReferences('url: ${{ secrets.NEXT_PUBLIC_API_URL }}\ntoken: ${{ env.DEPLOY_TOKEN }}');

    expect(refs).toEqual(['DEPLOY_TOKEN', 'NEXT_PUBLIC_API_URL']);
  });

  it('ignores common built-in environment variables', () => {
    const refs = extractEnvReferences('echo $PATH $HOME $PWD $SHELL $USER $CI $GITHUB_TOKEN ${DATABASE_URL}');

    expect(refs).toEqual(['DATABASE_URL']);
  });

  it('does not treat GitHub Actions expression syntax internals as variables', () => {
    const refs = extractEnvReferences('if: ${{ github.ref == \'refs/heads/main\' && secrets.DEPLOY_TOKEN != \'\' }}');

    expect(refs).toEqual(['DEPLOY_TOKEN']);
  });
});
