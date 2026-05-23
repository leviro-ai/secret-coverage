import { extractEnvReferences } from '../parsers/env.js';
import { globText } from '../utils/files.js';
import type { Scanner, VariableSource } from '../types.js';

const TERRAFORM_FILES = [
  '**/*.tf',
  '**/*.tfvars',
  '**/*.tfvars.json',
  '.terraformrc',
  'terraform.rc',
];

export const scanTerraform: Scanner = async ({ root }) => {
  const files = await globText(root, TERRAFORM_FILES);
  const referenced: VariableSource[] = [];

  for (const { file, content } of files) {
    for (const variable of extractEnvReferences(content, { ciExpressions: false })) {
      referenced.push({ variable, file, source: 'terraform' });
    }
  }

  return { declared: [], referenced, findings: [] };
};
