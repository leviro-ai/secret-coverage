import YAML from 'yaml';
import { extractEnvReferences } from '../parsers/env.js';
import { globText } from '../utils/files.js';
import type { Scanner, VariableSource } from '../types.js';

const AZURE_CONFIG_FILES = [
  '**/*.{json,yaml,yml}',
];

const AZURE_KEY_VAULT_SOURCE = 'azure-key-vault';

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

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function looksLikeAzureConfig(document: unknown): boolean {
  if (!isRecord(document)) return false;

  const type = stringValue(getCaseInsensitive(document, 'type'));
  if (type?.toLowerCase().startsWith('microsoft.')) return true;
  if (isRecord(getCaseInsensitive(document, 'resources'))) return true;
  if (Array.isArray(getCaseInsensitive(document, 'resources'))) return true;
  if (isRecord(getCaseInsensitive(document, 'properties')) && typeof type === 'string') return true;

  let hasAzureKeyVaultReference = false;
  walkValues(document, value => {
    if (typeof value !== 'string') return;
    const normalized = value.toLowerCase();
    if (normalized.includes('@microsoft.keyvault(') || normalized.includes('.vault.azure.net/secrets/')) {
      hasAzureKeyVaultReference = true;
    }
  });

  return hasAzureKeyVaultReference && hasAzureResourceMetadata(document);
}

function hasAzureResourceMetadata(document: unknown): boolean {
  let hasAzureMetadata = false;
  walkValues(document, value => {
    if (!isRecord(value)) return;
    const type = stringValue(getCaseInsensitive(value, 'type'));
    if (type?.toLowerCase().startsWith('microsoft.')) {
      hasAzureMetadata = true;
    }
  });
  return hasAzureMetadata;
}

function isAzureKeyVaultValue(value: unknown): boolean {
  return typeof value === 'string' && /(?:@Microsoft\.KeyVault\(|\.vault\.azure\.net\/secrets\/)/i.test(value);
}

function collectContainerAppSecretNames(document: unknown): Set<string> {
  const secretNames = new Set<string>();

  walkValues(document, value => {
    if (!isRecord(value)) return;
    const secrets = getCaseInsensitive(value, 'secrets');
    if (!Array.isArray(secrets)) return;

    for (const entry of secrets) {
      if (!isRecord(entry)) continue;
      const name = stringValue(getCaseInsensitive(entry, 'name'));
      const keyVaultUrl = getCaseInsensitive(entry, 'keyVaultUrl');
      const keyVaultUri = getCaseInsensitive(entry, 'keyVaultUri');
      if (name && (isAzureKeyVaultValue(keyVaultUrl) || isAzureKeyVaultValue(keyVaultUri))) {
        secretNames.add(name);
      }
    }
  });

  return secretNames;
}

function extractAzureKeyVaultEnvironmentNames(document: unknown): string[] {
  if (!looksLikeAzureConfig(document)) return [];

  const refs = new Set<string>();
  const containerAppSecretNames = collectContainerAppSecretNames(document);

  walkValues(document, value => {
    if (!isRecord(value)) return;

    const name = stringValue(getCaseInsensitive(value, 'name'));
    if (!name) return;

    const directValue = getCaseInsensitive(value, 'value');
    if (isAzureKeyVaultValue(directValue)) {
      refs.add(name);
    }

    const secretRef = stringValue(getCaseInsensitive(value, 'secretRef'));
    if (secretRef && containerAppSecretNames.has(secretRef)) {
      refs.add(name);
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

export const scanAzureKeyVault: Scanner = async ({ root }) => {
  const files = await globText(root, AZURE_CONFIG_FILES);
  const referenced: VariableSource[] = [];

  for (const { file, content } of files) {
    const variables = new Set<string>();

    for (const document of parseDocuments(content)) {
      if (!looksLikeAzureConfig(document)) continue;

      for (const variable of extractAzureKeyVaultEnvironmentNames(document)) {
        variables.add(variable);
      }

      for (const variable of extractEnvReferences(content, { ciExpressions: false })) {
        variables.add(variable);
      }
    }

    for (const variable of [...variables].sort()) {
      referenced.push({ variable, file, source: AZURE_KEY_VAULT_SOURCE });
    }
  }

  return { declared: [], referenced, findings: [] };
};
