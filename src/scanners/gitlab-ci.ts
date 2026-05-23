import { tryParseYaml } from '../parsers/config.js';
import { extractEnvReferences } from '../parsers/env.js';
import { globText } from '../utils/files.js';
import type { Scanner } from '../types.js';

const IGNORED_GITLAB_VARIABLE_KEYS = new Set([
  'CI',
  'CI_COMMIT_BRANCH',
  'CI_COMMIT_REF_NAME',
  'CI_COMMIT_SHA',
  'CI_DEFAULT_BRANCH',
  'CI_JOB_ID',
  'CI_JOB_NAME',
  'CI_PIPELINE_ID',
  'CI_PROJECT_DIR',
  'CI_PROJECT_NAME',
  'CI_PROJECT_PATH',
  'HOME',
  'NODE_ENV',
  'PATH',
  'PWD',
  'SHELL',
  'USER',
]);

function isVariableName(key: string): boolean {
  return /^[A-Z_][A-Z0-9_]*$/.test(key) && !IGNORED_GITLAB_VARIABLE_KEYS.has(key);
}

function isEmptyVariableValue(value: unknown): boolean {
  return value === null || value === undefined || value === '';
}

function valueText(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : '';
}

function hasVariableReference(value: string): boolean {
  return extractEnvReferences(value).length > 0;
}

function collectGitLabVariableMaps(value: unknown, visit: (key: string, child: unknown) => void): void {
  if (Array.isArray(value)) {
    for (const child of value) collectGitLabVariableMaps(child, visit);
    return;
  }

  if (!value || typeof value !== 'object') return;

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (key === 'variables' && child && typeof child === 'object' && !Array.isArray(child)) {
      for (const [variableKey, variableValue] of Object.entries(child as Record<string, unknown>)) {
        visit(variableKey, variableValue);
      }
    }
    collectGitLabVariableMaps(child, visit);
  }
}

function collectRequiredVariableKeys(value: unknown): Set<string> {
  const keys = new Set<string>();
  collectGitLabVariableMaps(value, (key, child) => {
    if (!isVariableName(key)) return;
    const text = valueText(child);
    if (isEmptyVariableValue(child) || hasVariableReference(text)) keys.add(key);
  });
  return keys;
}

function collectInlineDefinedVariableKeys(value: unknown): Set<string> {
  const keys = new Set<string>();
  collectGitLabVariableMaps(value, (key, child) => {
    if (!isVariableName(key)) return;
    const text = valueText(child);
    if (!isEmptyVariableValue(child) && !hasVariableReference(text)) keys.add(key);
  });
  return keys;
}

export const scanGitLabCI: Scanner = async ({ root }) => {
  const files = await globText(root, ['.gitlab-ci.yml', '.gitlab-ci.yaml']);
  return {
    declared: [],
    referenced: files.flatMap(({ file, content }) => {
      const parsed = tryParseYaml(content);
      const variables = new Set([...extractEnvReferences(content), ...collectRequiredVariableKeys(parsed)]);
      for (const variable of collectInlineDefinedVariableKeys(parsed)) variables.delete(variable);
      return [...variables].sort().map(variable => ({ variable, file, source: 'gitlab-ci' }));
    }),
    findings: [],
  };
};
