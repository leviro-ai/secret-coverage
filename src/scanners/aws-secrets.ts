import YAML from 'yaml';
import { extractEnvReferences } from '../parsers/env.js';
import { globText } from '../utils/files.js';
import type { Scanner, VariableSource } from '../types.js';

const AWS_CONFIG_FILES = [
  '**/*.{json,yaml,yml}',
];

const AWS_SECRETS_SOURCE = 'aws-secrets-manager';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function walkValues(value: unknown, visit: (value: unknown) => void): void {
  visit(value);
  if (Array.isArray(value)) {
    for (const child of value) walkValues(child, visit);
  } else if (isRecord(value)) {
    for (const child of Object.values(value)) walkValues(child, visit);
  }
}

function getCaseInsensitive(record: Record<string, unknown>, key: string): unknown {
  const found = Object.entries(record).find(([candidate]) => candidate.toLowerCase() === key.toLowerCase());
  return found?.[1];
}

function looksLikeAwsConfig(document: unknown): boolean {
  if (!isRecord(document)) return false;
  if (typeof document.AWSTemplateFormatVersion === 'string') return true;
  if (isRecord(document.Resources)) return true;
  if (Array.isArray(document.containerDefinitions)) return true;
  if (Array.isArray(document.ContainerDefinitions)) return true;
  if (isRecord(document.provider) && document.provider.name === 'aws') return true;

  let hasAwsSecretsManagerReference = false;
  walkValues(document, value => {
    if (typeof value === 'string' && value.toLowerCase().includes('secretsmanager')) {
      hasAwsSecretsManagerReference = true;
    }
  });
  return hasAwsSecretsManagerReference;
}

function isAwsSecretsValue(value: unknown): boolean {
  return typeof value === 'string' && /(?:arn:aws:secretsmanager|\{\{resolve:secretsmanager:|secretsmanager:)/i.test(value);
}

function extractAwsSecretEnvironmentNames(document: unknown): string[] {
  if (!looksLikeAwsConfig(document)) return [];

  const refs = new Set<string>();

  walkValues(document, value => {
    if (!isRecord(value)) return;

    const secrets = getCaseInsensitive(value, 'secrets');
    if (Array.isArray(secrets)) {
      for (const entry of secrets) {
        if (!isRecord(entry)) continue;
        const name = getCaseInsensitive(entry, 'name');
        const valueFrom = getCaseInsensitive(entry, 'valueFrom');
        if (typeof name === 'string' && isAwsSecretsValue(valueFrom)) {
          refs.add(name);
        }
      }
    }
  });

  return [...refs].sort();
}

function parseDocuments(content: string): unknown[] {
  try {
    return YAML.parseAllDocuments(content).map(document => document.toJSON());
  } catch {
    return [];
  }
}

export const scanAwsSecrets: Scanner = async ({ root }) => {
  const files = await globText(root, AWS_CONFIG_FILES);
  const referenced: VariableSource[] = [];

  for (const { file, content } of files) {
    const variables = new Set<string>();

    for (const document of parseDocuments(content)) {
      if (!looksLikeAwsConfig(document)) continue;

      for (const variable of extractAwsSecretEnvironmentNames(document)) {
        variables.add(variable);
      }

      for (const variable of extractEnvReferences(content, { ciExpressions: false })) {
        variables.add(variable);
      }
    }

    for (const variable of [...variables].sort()) {
      referenced.push({ variable, file, source: AWS_SECRETS_SOURCE });
    }
  }

  return { declared: [], referenced, findings: [] };
};
