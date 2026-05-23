import { extractEnvReferences } from '../parsers/env.js';
import { globText } from '../utils/files.js';
import type { Scanner, VariableSource } from '../types.js';

export const scanFly: Scanner = async ({ root }) => {
  const files = await globText(root, ['fly.toml']);
  const referenced: VariableSource[] = [];

  for (const { file, content } of files) {
    for (const variable of extractEnvReferences(content, { ciExpressions: false })) {
      referenced.push({ variable, file, source: 'fly' });
    }
  }

  return { declared: [], referenced, findings: [] };
};
