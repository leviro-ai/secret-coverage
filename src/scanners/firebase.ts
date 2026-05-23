import { extractEnvReferences } from '../parsers/env.js';
import { globText } from '../utils/files.js';
import type { Scanner, VariableSource } from '../types.js';

const FIREBASE_CONFIG_FILES = [
  'firebase.json',
  '.firebaserc',
  'functions/package.json',
  'package.json',
];

export const scanFirebase: Scanner = async ({ root }) => {
  const files = await globText(root, FIREBASE_CONFIG_FILES);
  const referenced: VariableSource[] = [];

  for (const { file, content } of files) {
    for (const variable of extractEnvReferences(content, { ciExpressions: false })) {
      referenced.push({ variable, file, source: 'firebase' });
    }
  }

  return { declared: [], referenced, findings: [] };
};
