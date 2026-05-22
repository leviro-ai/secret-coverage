import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';

const documentedCliOptions = ['--path', '--format', '--json', '--ci', '--strict'];
const documentedActionInputs = ['path', 'format', 'strict'];

describe('documentation command examples', () => {
  it('documents only CLI scan options exposed by the command', () => {
    const readme = readFileSync('README.md', 'utf8');
    const installation = readFileSync('docs/installation.md', 'utf8');
    const help = execFileSync('pnpm', ['tsx', 'src/cli.ts', 'scan', '--help'], {
      cwd: process.cwd(),
      encoding: 'utf8',
    });

    for (const option of documentedCliOptions) {
      expect(help).toContain(option);
      expect(readme).toContain(option);
    }

    expect(installation).toContain('envguard scan --ci');
    expect(installation).toContain('envguard scan --strict');
    expect(installation).toContain('envguard scan --json');
  });

  it('keeps GitHub Action examples aligned with action.yml inputs', () => {
    const action = parse(readFileSync('action.yml', 'utf8')) as { inputs: Record<string, unknown> };
    const docs = `${readFileSync('README.md', 'utf8')}\n${readFileSync('docs/installation.md', 'utf8')}`;

    for (const input of documentedActionInputs) {
      expect(Object.keys(action.inputs)).toContain(input);
    }

    expect(docs).toContain('uses: your-org/envguard@v0.1.0');
    expect(docs).toContain('format: markdown');
    expect(docs).toContain("strict: 'false'");
    expect(docs).toContain("strict: 'true'");
  });
});
