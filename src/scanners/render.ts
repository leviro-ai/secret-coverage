import { tryParseYaml, walkValues } from '../parsers/config.js';
import { extractEnvReferences } from '../parsers/env.js';
import { globText } from '../utils/files.js';
import type { Scanner, VariableSource } from '../types.js';

function isEnvVarRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) && typeof (value as Record<string, unknown>).key === 'string';
}

function requiresExternalRenderEnv(value: Record<string, unknown>): boolean {
  if (value.sync === false) return true;
  if ('fromDatabase' in value || 'fromService' in value || 'generateValue' in value) return false;
  if (!('value' in value)) return true;
  const rawValue = value.value;
  return typeof rawValue === 'string' && extractEnvReferences(rawValue, { ciExpressions: false }).length > 0;
}

function extractRenderEnvKeys(content: string): string[] {
  const parsed = tryParseYaml(content);
  const refs = new Set<string>();

  walkValues(parsed, value => {
    if (isEnvVarRecord(value) && requiresExternalRenderEnv(value)) {
      refs.add(value.key as string);
    }
  });

  return [...refs].sort();
}

export const scanRender: Scanner = async ({ root }) => {
  const files = await globText(root, ['render.{yaml,yml}']);
  const referenced: VariableSource[] = [];

  for (const { file, content } of files) {
    const variables = new Set<string>([
      ...extractEnvReferences(content, { ciExpressions: false }),
      ...extractRenderEnvKeys(content),
    ]);

    for (const variable of [...variables].sort()) {
      referenced.push({ variable, file, source: 'render' });
    }
  }

  return { declared: [], referenced, findings: [] };
};
