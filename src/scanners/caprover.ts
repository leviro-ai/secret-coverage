import { extractEnvReferences } from '../parsers/env.js';
import { globText } from '../utils/files.js';
import type { Scanner } from '../types.js';

export const scanCapRover: Scanner = async ({ root }) => {
  const files = await globText(root, ['captain-definition', 'captain-definition.json', 'caprover*.json']);
  return { declared: [], referenced: files.flatMap(({ file, content }) => extractEnvReferences(content).map(variable => ({ variable, file, source: 'caprover' }))), findings: [] };
};
