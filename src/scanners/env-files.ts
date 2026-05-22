import { readTextIfExists } from '../utils/files.js';
import { looksLikeSecret, parseEnv } from '../parsers/env.js';
import type { Scanner } from '../types.js';

const ENV_FILES = ['.env.example', '.env', '.env.local', '.env.production', '.env.development'];

export const scanEnvFiles: Scanner = async ({ root }) => {
  const declared = [];
  const findings = [];
  for (const file of ENV_FILES) {
    const content = await readTextIfExists(root, file);
    if (content === null) continue;
    for (const entry of parseEnv(content)) {
      declared.push({ variable: entry.key, value: entry.value, file, source: file });
      if (file !== '.env.example' && looksLikeSecret(entry.key, entry.value)) {
        findings.push({
          severity: 'critical' as const,
          type: 'plaintext-secret',
          variable: entry.key,
          file,
          message: `${entry.key} appears to contain a real secret in ${file}.`,
          recommendation: `Remove ${entry.key} from committed files, rotate the value if it was pushed, and keep only an empty placeholder in .env.example.`,
        });
      }
    }
  }
  return { declared, referenced: [], findings };
};
