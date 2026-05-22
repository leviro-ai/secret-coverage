import YAML from 'yaml';

export function tryParseYaml(content: string): unknown {
  try { return YAML.parse(content); } catch { return null; }
}

export function tryParseJson(content: string): unknown {
  try { return JSON.parse(content); } catch { return null; }
}

export function walkValues(value: unknown, visit: (value: unknown) => void): void {
  visit(value);
  if (Array.isArray(value)) {
    for (const child of value) walkValues(child, visit);
  } else if (value && typeof value === 'object') {
    for (const child of Object.values(value as Record<string, unknown>)) walkValues(child, visit);
  }
}
