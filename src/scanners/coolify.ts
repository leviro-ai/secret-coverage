import { extractEnvReferences } from '../parsers/env.js';
import { globText } from '../utils/files.js';
import type { Scanner, VariableSource } from '../types.js';

const COOLIFY_CONFIG_FILES = [
  'coolify.{json,yml,yaml,toml}',
  '.coolify/**/*.{json,yml,yaml,toml}',
  'docker-compose.coolify.{yml,yaml}',
  'compose.coolify.{yml,yaml}',
  'coolify/docker-compose.{yml,yaml}',
];

export const scanCoolify: Scanner = async ({ root }) => {
  const files = await globText(root, COOLIFY_CONFIG_FILES);
  const referenced: VariableSource[] = [];

  for (const { file, content } of files) {
    for (const variable of extractEnvReferences(content, { ciExpressions: false })) {
      referenced.push({ variable, file, source: 'coolify' });
    }
  }

  return { declared: [], referenced, findings: [] };
};
