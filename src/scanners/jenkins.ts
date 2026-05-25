import { extractEnvReferences } from '../parsers/env.js';
import { globText } from '../utils/files.js';
import type { Scanner } from '../types.js';

const JENKINS_PROVIDED_VARIABLES = new Set([
  'BUILD_ID',
  'BUILD_NUMBER',
  'BUILD_TAG',
  'BUILD_URL',
  'CHANGE_AUTHOR',
  'CHANGE_BRANCH',
  'CHANGE_ID',
  'CHANGE_TARGET',
  'EXECUTOR_NUMBER',
  'HUDSON_HOME',
  'HUDSON_URL',
  'JENKINS_HOME',
  'JENKINS_URL',
  'JOB_BASE_NAME',
  'JOB_NAME',
  'NODE_LABELS',
  'NODE_NAME',
  'RUN_DISPLAY_URL',
  'RUN_TESTS_DISPLAY_URL',
  'STAGE_NAME',
  'WORKSPACE',
  'WORKSPACE_TMP',
  'BRANCH_NAME',
  'TAG_NAME',
]);

function extractJenkinsEnvironmentDefinitions(content: string): Set<string> {
  const defined = new Set<string>();
  const environmentBlocks = content.matchAll(/environment\s*\{([\s\S]*?)^\s*\}/gm);

  for (const block of environmentBlocks) {
    for (const line of block[1].split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.+?)\s*$/);
      if (!match) continue;

      const [, variable, rawValue] = match;
      if (extractEnvReferences(rawValue).length === 0) {
        defined.add(variable);
      }
    }
  }

  const withEnvBlocks = content.matchAll(/withEnv\s*\(\s*\[([\s\S]*?)\]\s*\)/gm);
  for (const block of withEnvBlocks) {
    const entries = block[1].matchAll(/["']([A-Z][A-Z0-9_]*=.*?)["']/g);
    for (const entry of entries) {
      const [variable, rawValue = ''] = entry[1].split(/=(.*)/s);
      if (variable && extractEnvReferences(rawValue).length === 0) {
        defined.add(variable);
      }
    }
  }

  return defined;
}

export const scanJenkins: Scanner = async ({ root }) => {
  const files = await globText(root, ['Jenkinsfile', '**/Jenkinsfile', 'Jenkinsfile.*', '**/Jenkinsfile.*']);
  return {
    declared: [],
    referenced: files.flatMap(({ file, content }) => {
      const jenkinsDefinedVariables = extractJenkinsEnvironmentDefinitions(content);
      return extractEnvReferences(content)
        .filter(variable => !JENKINS_PROVIDED_VARIABLES.has(variable))
        .filter(variable => !jenkinsDefinedVariables.has(variable))
        .map(variable => ({ variable, file, source: 'jenkins' }));
    }),
    findings: [],
  };
};
