import { extractEnvReferences } from '../parsers/env.js';
import { globText } from '../utils/files.js';
import type { Scanner } from '../types.js';

export const scanGitHubActions: Scanner = async ({ root }) => {
  const files = await globText(root, ['.github/workflows/*.{yml,yaml}']);
  return {
    declared: [],
    referenced: files.flatMap(({ file, content }) => extractEnvReferences(content).map(variable => ({ variable, file, source: 'github-actions' }))),
    findings: [],
  };
};
