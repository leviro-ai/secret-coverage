import { extractEnvReferences } from '../parsers/env.js';
import { globText } from '../utils/files.js';
import type { Scanner } from '../types.js';

export const scanDocker: Scanner = async ({ root }) => {
  const files = await globText(root, ['Dockerfile', '**/Dockerfile', 'docker-compose.{yml,yaml}', 'compose.{yml,yaml}']);
  return { declared: [], referenced: files.flatMap(({ file, content }) => extractEnvReferences(content).map(variable => ({ variable, file, source: 'docker' }))), findings: [] };
};
