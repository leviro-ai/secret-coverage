import { extractEnvReferences } from '../parsers/env.js';
import { globText } from '../utils/files.js';
import type { Scanner, VariableSource } from '../types.js';

const HASHICORP_VAULT_FILES = [
  '**/*.{hcl,json,yaml,yml}',
];

const HASHICORP_VAULT_SOURCE = 'hashicorp-vault';
const ENV_ASSIGNMENT_WITH_VAULT_TEMPLATE = /^\s*([A-Z][A-Z0-9_]*)\s*=\s*.*\{\{\s*with\s+secret\s+["'][^"']+["']/gm;

function pathLooksVaultSpecific(file: string): boolean {
  const normalized = file.toLowerCase();
  return normalized.includes('vault') || normalized.endsWith('.hcl');
}

function contentLooksLikeVaultMetadata(content: string): boolean {
  const normalized = content.toLowerCase();
  return normalized.includes('{{ with secret ') ||
    normalized.includes('vault.hashicorp.com/') ||
    normalized.includes('vault {') ||
    normalized.includes('hashicorp/vault');
}

function extractVaultTemplateAssignments(content: string): string[] {
  const refs = new Set<string>();
  for (const match of content.matchAll(ENV_ASSIGNMENT_WITH_VAULT_TEMPLATE)) {
    refs.add(match[1]);
  }
  return [...refs].sort();
}

export const scanHashicorpVault: Scanner = async ({ root }) => {
  const files = await globText(root, HASHICORP_VAULT_FILES);
  const referenced: VariableSource[] = [];

  for (const { file, content } of files) {
    if (!pathLooksVaultSpecific(file) || !contentLooksLikeVaultMetadata(content)) continue;

    const variables = new Set<string>();
    for (const variable of extractVaultTemplateAssignments(content)) {
      variables.add(variable);
    }
    for (const variable of extractEnvReferences(content, { ciExpressions: false })) {
      variables.add(variable);
    }

    for (const variable of [...variables].sort()) {
      referenced.push({ variable, file, source: HASHICORP_VAULT_SOURCE });
    }
  }

  return { declared: [], referenced, findings: [] };
};
