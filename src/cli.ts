#!/usr/bin/env node
import { Command } from 'commander';
import { scanProject } from './engine.js';
import { formatJson, formatMarkdown } from './formatters.js';

const program = new Command();
program
  .name('envguard')
  .description('Detect missing environment variables before your deployment fails.')
  .version('0.1.0');

program.command('scan')
  .description('Scan repository environment variable declarations and deployment references')
  .option('-p, --path <path>', 'project path', process.cwd())
  .option('--format <format>', 'markdown or json', 'markdown')
  .option('--json', 'alias for --format json')
  .option('--strict', 'exit non-zero on warnings as well as critical findings')
  .option('--ci', 'CI mode: concise output and non-zero on critical findings')
  .action(async (options) => {
    const result = await scanProject(options.path);
    const format = options.json ? 'json' : options.format;
    process.stdout.write(format === 'json' ? formatJson(result) : formatMarkdown(result));
    const shouldFail = result.summary.critical > 0 || Boolean(options.strict && result.summary.warning > 0);
    if (options.ci || options.strict) process.exitCode = shouldFail ? 1 : 0;
  });

program.parseAsync();
