import { readTextIfExists } from '../utils/files.js';
import { looksLikeSecret, parseEnv } from '../parsers/env.js';
import type { Scanner } from '../types.js';

const LOCAL_ENV_FILES = ['.env', '.env.local', '.env.production', '.env.development'];

export const scanEnvFiles: Scanner = async ({ root, envTemplateFiles }) => {
  const declared = [];
  const findings = [];
  const templateFiles = new Set(envTemplateFiles);
  const envFiles = [...envTemplateFiles, ...LOCAL_ENV_FILES.filter(file => !templateFiles.has(file))];

  const foundEnvFiles: string[] = [];

  for (const file of envFiles) {
    const content = await readTextIfExists(root, file);
    if (content === null) continue;
    foundEnvFiles.push(file);
    for (const entry of parseEnv(content)) {
      declared.push({ variable: entry.key, value: entry.value, file, source: file });
      if (!templateFiles.has(file) && looksLikeSecret(entry.key, entry.value)) {
        findings.push({
          severity: 'critical' as const,
          type: 'plaintext-secret',
          variable: entry.key,
          file,
          message: `${entry.key} appears to contain a real secret in ${file}.`,
          recommendation: `Remove ${entry.key} from committed files, rotate the value if it was pushed, and keep only an empty placeholder in your env template.`,
        });
      }
    }
  }
  const notices = foundEnvFiles.length === 0
    ? [`No env files found. EnvGuard looked for: ${envFiles.join(', ')}. Use --env-template <file> if your repo uses a different template filename.`]
    : [];

  return { declared, referenced: [], findings, notices };
};
