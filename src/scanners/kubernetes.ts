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

function metadataName(manifest: Record<string, unknown>): string | undefined {
  const metadata = manifest.metadata;
  if (!isRecord(metadata) || typeof metadata.name !== 'string') return undefined;
  return metadata.name;
}

function objectKeys(value: unknown): string[] {
  if (!isRecord(value)) return [];
  return Object.keys(value).filter(key => /^[A-Z][A-Z0-9_]*$/.test(key));
}

type KubernetesEnvFromResources = {
  configMaps: Map<string, string[]>;
  secrets: Map<string, string[]>;
};

function collectEnvFromResources(documents: unknown[]): KubernetesEnvFromResources {
  const configMaps = new Map<string, string[]>();
  const secrets = new Map<string, string[]>();

  for (const document of documents) {
    if (!isKubernetesManifest(document)) continue;
    const name = metadataName(document);
    if (!name) continue;

    if (document.kind === 'ConfigMap') {
      const keys = objectKeys(document.data).sort();
      if (keys.length > 0) configMaps.set(name, keys);
    }

    if (document.kind === 'Secret') {
      const keys = [...new Set([...objectKeys(document.data), ...objectKeys(document.stringData)])].sort();
      if (keys.length > 0) secrets.set(name, keys);
    }
  }

  return { configMaps, secrets };
}

function addEnvFromReferences(
  envFrom: unknown,
  refs: Set<string>,
  resources: KubernetesEnvFromResources,
): void {
  if (!Array.isArray(envFrom)) return;

  for (const entry of envFrom) {
    if (!isRecord(entry)) continue;

    const secretRef = entry.secretRef;
    if (isRecord(secretRef) && typeof secretRef.name === 'string') {
      for (const variable of resources.secrets.get(secretRef.name) ?? []) refs.add(variable);
    }

    const configMapRef = entry.configMapRef;
    if (isRecord(configMapRef) && typeof configMapRef.name === 'string') {
      for (const variable of resources.configMaps.get(configMapRef.name) ?? []) refs.add(variable);
    }
  }
}

function extractManifestEnvReferences(manifest: unknown, resources: KubernetesEnvFromResources): string[] {
  if (!isKubernetesManifest(manifest)) return [];

  const refs = new Set<string>();

  walkValues(manifest, value => {
    if (!isRecord(value)) return;

    addEnvFromReferences(value.envFrom, refs, resources);

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
    const documents = parseKubernetesDocuments(content);
    const resources = collectEnvFromResources(documents);

    for (const document of documents) {
      for (const variable of extractManifestEnvReferences(document, resources)) {
        variables.add(variable);
      }
    }

    for (const variable of [...variables].sort()) {
      referenced.push({ variable, file, source: 'kubernetes' });
    }
  }

  return { declared: [], referenced, findings: [] };
};
