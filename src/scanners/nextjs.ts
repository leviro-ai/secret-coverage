import { extractEnvReferences } from '../parsers/env.js';
import { globText } from '../utils/files.js';
import type { Scanner } from '../types.js';

export const scanNextJs: Scanner = async ({ root }) => {
  const files = await globText(root, ['next.config.{js,mjs,cjs,ts}', 'src/**/*.{js,jsx,ts,tsx}', 'app/**/*.{js,jsx,ts,tsx}', 'pages/**/*.{js,jsx,ts,tsx}']);
  return {
    declared: [],
    referenced: files.flatMap(({ file, content }) =>
      extractEnvReferences(content, { shell: false, ciExpressions: false }).map(variable => ({ variable, file, source: 'nextjs' })),
    ),
    findings: [],
  };
};
