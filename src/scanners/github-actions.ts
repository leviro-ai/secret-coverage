import { tryParseYaml } from '../parsers/config.js';
import { extractEnvReferences } from '../parsers/env.js';
import { globText } from '../utils/files.js';
import type { Scanner } from '../types.js';

const IGNORED_GITHUB_ACTIONS_ENV_KEYS = new Set([
  'CI',
  'GITHUB_ACTION',
  'GITHUB_ACTIONS',
  'GITHUB_ACTOR',
  'GITHUB_BASE_REF',
  'GITHUB_ENV',
  'GITHUB_EVENT_NAME',
  'GITHUB_EVENT_PATH',
  'GITHUB_HEAD_REF',
  'GITHUB_JOB',
  'GITHUB_OUTPUT',
  'GITHUB_PATH',
  'GITHUB_REF',
  'GITHUB_REF_NAME',
  'GITHUB_REF_TYPE',
  'GITHUB_REPOSITORY',
  'GITHUB_RUN_ID',
  'GITHUB_RUN_NUMBER',
  'GITHUB_SHA',
  'GITHUB_STEP_SUMMARY',
  'GITHUB_WORKFLOW',
  'GITHUB_WORKSPACE',
  'HOME',
  'NODE_ENV',
  'PATH',
  'PWD',
  'RUNNER_OS',
  'SHELL',
  'USER',
]);

function isVariableName(key: string): boolean {
  return /^[A-Z_][A-Z0-9_]*$/.test(key) && !IGNORED_GITHUB_ACTIONS_ENV_KEYS.has(key);
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

function collectGitHubActionsEnvMaps(value: unknown, visit: (key: string, child: unknown) => void): void {
  if (Array.isArray(value)) {
    for (const child of value) collectGitHubActionsEnvMaps(child, visit);
    return;
  }

  if (!value || typeof value !== 'object') return;

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (key === 'env' && child && typeof child === 'object' && !Array.isArray(child)) {
      for (const [variableKey, variableValue] of Object.entries(child as Record<string, unknown>)) {
        visit(variableKey, variableValue);
      }
    }
    collectGitHubActionsEnvMaps(child, visit);
  }
}

function collectRequiredEnvKeys(value: unknown): Set<string> {
  const keys = new Set<string>();
  collectGitHubActionsEnvMaps(value, (key, child) => {
    if (!isVariableName(key)) return;
    const text = valueText(child);
    if (isEmptyVariableValue(child) || hasVariableReference(text)) keys.add(key);
  });
  return keys;
}

function collectInlineDefinedEnvKeys(value: unknown): Set<string> {
  const keys = new Set<string>();
  collectGitHubActionsEnvMaps(value, (key, child) => {
    if (!isVariableName(key)) return;
    const text = valueText(child);
    if (!isEmptyVariableValue(child) && !hasVariableReference(text)) keys.add(key);
  });
  return keys;
}

export const scanGitHubActions: Scanner = async ({ root }) => {
  const files = await globText(root, ['.github/workflows/*.{yml,yaml}']);
  return {
    declared: [],
    referenced: files.flatMap(({ file, content }) => {
      const parsed = tryParseYaml(content);
      const variables = new Set([...extractEnvReferences(content), ...collectRequiredEnvKeys(parsed)]);
      for (const variable of [...variables]) {
        if (IGNORED_GITHUB_ACTIONS_ENV_KEYS.has(variable)) variables.delete(variable);
      }
      for (const variable of collectInlineDefinedEnvKeys(parsed)) variables.delete(variable);
      return [...variables].sort().map(variable => ({ variable, file, source: 'github-actions' }));
    }),
    findings: [],
  };
};
