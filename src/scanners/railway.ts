import { extractEnvReferences } from '../parsers/env.js';
import { globText } from '../utils/files.js';
import type { Scanner, VariableSource } from '../types.js';

export const scanRailway: Scanner = async ({ root }) => {
  const files = await globText(root, ['railway.toml', 'railway.json', '.railway/config.json']);
  const referenced: VariableSource[] = [];

  for (const { file, content } of files) {
    for (const variable of extractEnvReferences(content, { ciExpressions: false })) {
      referenced.push({ variable, file, source: 'railway' });
    }
  }

  return { declared: [], referenced, findings: [] };
};
