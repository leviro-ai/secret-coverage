import { extractEnvReferences } from '../parsers/env.js';
import { globText } from '../utils/files.js';
import type { Scanner } from '../types.js';

export const scanGitLabCI: Scanner = async ({ root }) => {
  const files = await globText(root, ['.gitlab-ci.yml', '.gitlab-ci.yaml']);
  return {
    declared: [],
    referenced: files.flatMap(({ file, content }) =>
      extractEnvReferences(content).map(variable => ({ variable, file, source: 'gitlab-ci' })),
    ),
    findings: [],
  };
};
