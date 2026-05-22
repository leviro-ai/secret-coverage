import { tryParseYaml } from '../parsers/config.js';
import { extractEnvReferences } from '../parsers/env.js';
import { globText } from '../utils/files.js';
import type { Scanner } from '../types.js';

const IGNORED_CIRCLECI_ENVIRONMENT_KEYS = new Set([
  'CI',
  'HOME',
  'NODE_ENV',
  'PATH',
  'PWD',
  'SHELL',
  'USER',
]);

function collectEnvironmentKeys(value: unknown, keys = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    for (const child of value) collectEnvironmentKeys(child, keys);
    return keys;
  }

  if (!value || typeof value !== 'object') return keys;

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (key === 'environment' && child && typeof child === 'object' && !Array.isArray(child)) {
      for (const envKey of Object.keys(child as Record<string, unknown>)) {
        if (/^[A-Z_][A-Z0-9_]*$/.test(envKey) && !IGNORED_CIRCLECI_ENVIRONMENT_KEYS.has(envKey)) {
          keys.add(envKey);
        }
      }
    }
    collectEnvironmentKeys(child, keys);
  }

  return keys;
}

export const scanCircleCI: Scanner = async ({ root }) => {
  const files = await globText(root, ['.circleci/config.yml', '.circleci/config.yaml']);
  return {
    declared: [],
    referenced: files.flatMap(({ file, content }) => {
      const parsed = tryParseYaml(content);
      const variables = new Set([...extractEnvReferences(content), ...collectEnvironmentKeys(parsed)]);
      return [...variables].sort().map(variable => ({ variable, file, source: 'circleci' }));
    }),
    findings: [],
  };
};
