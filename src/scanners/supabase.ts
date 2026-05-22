import { extractEnvReferences } from '../parsers/env.js';
import { globText } from '../utils/files.js';
import type { Scanner } from '../types.js';

export const scanSupabase: Scanner = async ({ root }) => {
  const files = await globText(root, ['supabase/config.toml', 'supabase/**/*.toml']);
  return { declared: [], referenced: files.flatMap(({ file, content }) => extractEnvReferences(content).map(variable => ({ variable, file, source: 'supabase' }))), findings: [] };
};
