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

export const scanJenkins: Scanner = async ({ root }) => {
  const files = await globText(root, ['Jenkinsfile', '**/Jenkinsfile', 'Jenkinsfile.*', '**/Jenkinsfile.*']);
  return {
    declared: [],
    referenced: files.flatMap(({ file, content }) =>
      extractEnvReferences(content)
        .filter(variable => !JENKINS_PROVIDED_VARIABLES.has(variable))
        .map(variable => ({ variable, file, source: 'jenkins' })),
    ),
    findings: [],
  };
};
