import { extractEnvReferences } from '../parsers/env.js';
import { globText } from '../utils/files.js';
import type { Scanner, VariableSource } from '../types.js';

function captainDockerfileLines(content: string): string[] {
  try {
    const parsed = JSON.parse(content) as { dockerfileLines?: unknown };
    if (Array.isArray(parsed.dockerfileLines)) {
      return parsed.dockerfileLines.filter((line): line is string => typeof line === 'string');
    }
  } catch {
    // Keep scanning raw content below when captain-definition is not strict JSON.
  }
  return [];
}

function buildArgReferences(lines: string[], file: string): VariableSource[] {
  return lines.flatMap(line => {
    const match = line.trim().match(/^ARG\s+([A-Z_][A-Z0-9_]*)(?:\s*=\s*(.*))?$/i);
    if (!match) return [];

    const variable = match[1];
    const defaultValue = match[2];
    if (defaultValue && defaultValue.trim() !== '') return [];

    return [{ variable, file, source: 'caprover' }];
  });
}

function uniqueReferences(references: VariableSource[]): VariableSource[] {
  const seen = new Set<string>();
  return references.filter(reference => {
    const key = `${reference.variable}:${reference.file}:${reference.source}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const scanCapRover: Scanner = async ({ root }) => {
  const files = await globText(root, ['captain-definition', 'captain-definition.json', 'caprover*.json']);
  const referenced = files.flatMap(({ file, content }) => {
    const shellReferences = extractEnvReferences(content).map(variable => ({ variable, file, source: 'caprover' }));
    const buildArgReferencesWithoutDefaults = buildArgReferences(captainDockerfileLines(content), file);
    return [...shellReferences, ...buildArgReferencesWithoutDefaults];
  });

  return { declared: [], referenced: uniqueReferences(referenced), findings: [] };
};
