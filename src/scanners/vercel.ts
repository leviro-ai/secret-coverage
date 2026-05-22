import { extractEnvReferences } from '../parsers/env.js';
import { tryParseJson } from '../parsers/config.js';
import { globText } from '../utils/files.js';
import type { Scanner, VariableSource } from '../types.js';

function extractVercelEnvKeys(content: string): string[] {
  const parsed = tryParseJson(content);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return [];
  const env = (parsed as Record<string, unknown>).env;
  if (!env || typeof env !== 'object' || Array.isArray(env)) return [];
  return Object.keys(env).filter(key => /^[A-Za-z_][A-Za-z0-9_]*$/.test(key));
}

export const scanVercel: Scanner = async ({ root }) => {
  const files = await globText(root, ['vercel.json', '.vercel/project.json']);
  const referenced: VariableSource[] = [];

  for (const { file, content } of files) {
    const variables = new Set([...extractEnvReferences(content), ...extractVercelEnvKeys(content)]);
    for (const variable of variables) referenced.push({ variable, file, source: 'vercel' });
  }

  return { declared: [], referenced, findings: [] };
};
