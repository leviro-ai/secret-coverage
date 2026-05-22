import { tryParseYaml } from '../parsers/config.js';
import { extractEnvReferences, looksLikeSecret } from '../parsers/env.js';
import { globText } from '../utils/files.js';
import type { Finding, Scanner } from '../types.js';

const IGNORED_CIRCLECI_ENVIRONMENT_KEYS = new Set([
  'CI',
  'HOME',
  'NODE_ENV',
  'PATH',
  'PWD',
  'SHELL',
  'USER',
]);

function isEnvironmentVariableName(key: string): boolean {
  return /^[A-Z_][A-Z0-9_]*$/.test(key) && !IGNORED_CIRCLECI_ENVIRONMENT_KEYS.has(key);
}

function isEmptyEnvironmentValue(value: unknown): boolean {
  return value === null || value === undefined || value === '';
}

function collectEnvironmentKeys(value: unknown, keys = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    for (const child of value) collectEnvironmentKeys(child, keys);
    return keys;
  }

  if (!value || typeof value !== 'object') return keys;

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (key === 'environment' && child && typeof child === 'object' && !Array.isArray(child)) {
      for (const [envKey, envValue] of Object.entries(child as Record<string, unknown>)) {
        if (isEnvironmentVariableName(envKey) && isEmptyEnvironmentValue(envValue)) {
          keys.add(envKey);
        }
      }
    }
    collectEnvironmentKeys(child, keys);
  }

  return keys;
}

function hasEnvironmentReference(value: string): boolean {
  return extractEnvReferences(value).length > 0 || /^<<.+>>$/.test(value.trim());
}

function collectInlineDefinedEnvironmentKeys(value: unknown, keys = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    for (const child of value) collectInlineDefinedEnvironmentKeys(child, keys);
    return keys;
  }

  if (!value || typeof value !== 'object') return keys;

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (key === 'environment' && child && typeof child === 'object' && !Array.isArray(child)) {
      for (const [envKey, envValue] of Object.entries(child as Record<string, unknown>)) {
        const valueText = typeof envValue === 'string' || typeof envValue === 'number' || typeof envValue === 'boolean' ? String(envValue) : '';
        if (isEnvironmentVariableName(envKey) && !isEmptyEnvironmentValue(envValue) && !hasEnvironmentReference(valueText)) {
          keys.add(envKey);
        }
      }
    }
    collectInlineDefinedEnvironmentKeys(child, keys);
  }

  return keys;
}

function collectPlaintextSecretFindings(value: unknown, file: string, findings: Finding[] = []): Finding[] {
  if (Array.isArray(value)) {
    for (const child of value) collectPlaintextSecretFindings(child, file, findings);
    return findings;
  }

  if (!value || typeof value !== 'object') return findings;

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (key === 'environment' && child && typeof child === 'object' && !Array.isArray(child)) {
      for (const [envKey, envValue] of Object.entries(child as Record<string, unknown>)) {
        const valueText = typeof envValue === 'string' || typeof envValue === 'number' ? String(envValue) : '';
        if (isEnvironmentVariableName(envKey) && looksLikeSecret(envKey, valueText)) {
          findings.push({
            severity: 'warning',
            type: 'plaintext-secret',
            variable: envKey,
            file,
            message: `${envKey} appears to contain a plaintext secret in ${file}.`,
            recommendation: `Move ${envKey} to CircleCI environment variables or contexts and reference it as $${envKey}.`,
          });
        }
      }
    }
    collectPlaintextSecretFindings(child, file, findings);
  }

  return findings;
}

export const scanCircleCI: Scanner = async ({ root }) => {
  const files = await globText(root, ['.circleci/config.yml', '.circleci/config.yaml']);
  return {
    declared: [],
    referenced: files.flatMap(({ file, content }) => {
      const parsed = tryParseYaml(content);
      const inlineDefined = collectInlineDefinedEnvironmentKeys(parsed);
      const variables = new Set([...extractEnvReferences(content), ...collectEnvironmentKeys(parsed)]);
      for (const variable of inlineDefined) variables.delete(variable);
      return [...variables].sort().map(variable => ({ variable, file, source: 'circleci' }));
    }),
    findings: files.flatMap(({ file, content }) => collectPlaintextSecretFindings(tryParseYaml(content), file)),
  };
};
