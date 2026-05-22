export type EnvEntry = { key: string; value: string; line: number };

export function parseEnv(content: string): EnvEntry[] {
  return content.split(/\r?\n/).flatMap((raw, index) => {
    const line = raw.trim();
    if (!line || line.startsWith('#')) return [];
    const normalized = line.startsWith('export ') ? line.slice(7).trim() : line;
    const match = normalized.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) return [];
    const value = match[2].replace(/^['"]|['"]$/g, '');
    return [{ key: match[1], value, line: index + 1 }];
  });
}

const IGNORED_ENV_REFERENCES = new Set([
  'PATH',
  'HOME',
  'PWD',
  'SHELL',
  'USER',
  'CI',
  'GITHUB_TOKEN',
  'NODE_ENV',
]);

export function extractEnvReferences(content: string): string[] {
  const refs = new Set<string>();
  const patterns = [
    /process\.env(?:\.|\?\.)([A-Za-z_][A-Za-z0-9_]*)/g,
    /process\.env\[['"]([A-Za-z_][A-Za-z0-9_]*)['"]\]/g,
    /\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g,
    /\$([A-Za-z_][A-Za-z0-9_]*)/g,
    /secrets\.([A-Za-z_][A-Za-z0-9_]*)/g,
    /env\.([A-Za-z_][A-Za-z0-9_]*)/g,
  ];
  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      const name = match[1];
      if (!IGNORED_ENV_REFERENCES.has(name)) refs.add(name);
    }
  }
  return [...refs].sort();
}

export function looksLikeSecret(key: string, value: string): boolean {
  if (!value || value.includes('your_') || value.includes('<') || value.includes('example')) return false;
  const sensitiveName = /(SECRET|TOKEN|PASSWORD|PRIVATE|API_KEY|SERVICE_ROLE|DATABASE_URL|STRIPE|SUPABASE)/i.test(key);
  const highEntropyish = value.length >= 16 && !/^https?:\/\//.test(value);
  const knownPrefix = /^(sk_live_|ghp_|github_pat_|xox[baprs]-|eyJ|postgres:\/\/|mysql:\/\/)/.test(value);
  return sensitiveName && (highEntropyish || knownPrefix);
}
