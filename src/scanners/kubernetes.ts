import YAML from 'yaml';
import { extractEnvReferences } from '../parsers/env.js';
import { globText } from '../utils/files.js';
import type { Scanner, VariableSource } from '../types.js';

const KUBERNETES_FILES = [
  '**/*.{yaml,yml}',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isKubernetesManifest(value: unknown): value is Record<string, unknown> {
  return isRecord(value) && typeof value.apiVersion === 'string' && typeof value.kind === 'string';
}

function walkValues(value: unknown, visit: (value: unknown) => void): void {
  visit(value);
  if (Array.isArray(value)) {
    for (const child of value) walkValues(child, visit);
  } else if (isRecord(value)) {
    for (const child of Object.values(value)) walkValues(child, visit);
  }
}

function hasSecretOrConfigMapValueFrom(value: Record<string, unknown>): boolean {
  const valueFrom = value.valueFrom;
  return isRecord(valueFrom) && (isRecord(valueFrom.secretKeyRef) || isRecord(valueFrom.configMapKeyRef));
}

function extractManifestEnvReferences(manifest: unknown): string[] {
  if (!isKubernetesManifest(manifest)) return [];

  const refs = new Set<string>();

  walkValues(manifest, value => {
    if (!isRecord(value)) return;

    const env = value.env;
    if (Array.isArray(env)) {
      for (const entry of env) {
        if (!isRecord(entry) || typeof entry.name !== 'string') continue;

        if (hasSecretOrConfigMapValueFrom(entry)) {
          refs.add(entry.name);
        }

        if (typeof entry.value === 'string') {
          for (const variable of extractEnvReferences(entry.value, { ciExpressions: false })) {
            refs.add(variable);
          }
        }
      }
    }
  });

  return [...refs].sort();
}

function parseKubernetesDocuments(content: string): unknown[] {
  try {
    return YAML.parseAllDocuments(content).map(document => document.toJSON());
  } catch {
    return [];
  }
}

export const scanKubernetes: Scanner = async ({ root }) => {
  const files = await globText(root, KUBERNETES_FILES);
  const referenced: VariableSource[] = [];

  for (const { file, content } of files) {
    const variables = new Set<string>();

    for (const document of parseKubernetesDocuments(content)) {
      for (const variable of extractManifestEnvReferences(document)) {
        variables.add(variable);
      }
    }

    for (const variable of [...variables].sort()) {
      referenced.push({ variable, file, source: 'kubernetes' });
    }
  }

  return { declared: [], referenced, findings: [] };
};
