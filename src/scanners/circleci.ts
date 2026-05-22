import { extractEnvReferences } from '../parsers/env.js';
import { globText } from '../utils/files.js';
import type { Scanner } from '../types.js';

export const scanCircleCI: Scanner = async ({ root }) => {
  const files = await globText(root, ['.circleci/config.yml', '.circleci/config.yaml']);
  return { declared: [], referenced: files.flatMap(({ file, content }) => extractEnvReferences(content).map(variable => ({ variable, file, source: 'circleci' }))), findings: [] };
};
