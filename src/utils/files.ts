import fg from 'fast-glob';
import { readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

export async function readTextIfExists(root: string, relativePath: string): Promise<string | null> {
  try {
    return await readFile(join(root, relativePath), 'utf8');
  } catch {
    return null;
  }
}

export async function globText(root: string, patterns: string[]): Promise<Array<{ file: string; content: string }>> {
  const files = await fg(patterns, { cwd: root, dot: true, onlyFiles: true, ignore: ['node_modules/**', 'dist/**', '.git/**'] });
  const result = [];
  for (const file of files) {
    result.push({ file, content: await readFile(join(root, file), 'utf8') });
  }
  return result;
}

export function normalizeFile(root: string, file: string): string {
  return relative(root, file) || file;
}
