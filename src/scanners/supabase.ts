import { extractEnvReferences } from '../parsers/env.js';
import { globText } from '../utils/files.js';
import type { Scanner } from '../types.js';

function extractDenoEnvReferences(content: string): string[] {
  const refs = new Set<string>();
  const pattern = /Deno\.env\.get\(\s*['"]([A-Za-z_][A-Za-z0-9_]*)['"]\s*\)/g;
  for (const match of content.matchAll(pattern)) refs.add(match[1]);
  return [...refs].sort();
}

export const scanSupabase: Scanner = async ({ root }) => {
  const files = await globText(root, [
    'supabase/config.toml',
    'supabase/**/*.toml',
    'supabase/functions/**/*.{ts,tsx,js,mjs,cjs}',
  ]);
  return {
    declared: [],
    referenced: files.flatMap(({ file, content }) => [...new Set([
      ...extractEnvReferences(content, { ciExpressions: false }),
      ...extractDenoEnvReferences(content),
    ])].map(variable => ({ variable, file, source: 'supabase' }))),
    findings: [],
  };
};
