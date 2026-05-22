#!/usr/bin/env node
import { Command } from 'commander';
import { createRequire } from 'node:module';
import { scanProject } from './engine.js';
import { formatJson, formatMarkdown } from './formatters.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json') as { version: string };

const program = new Command();
program
  .name('secret-coverage')
  .description('Environment Secret Coverage Checker: detect missing environment variables before deployment fails.')
  .version(pkg.version);

program.command('scan')
  .description('Scan repository environment variable declarations and deployment references')
  .option('-p, --path <path>', 'project path', process.cwd())
  .option('--env-template <file>', 'env template file to compare references against (default: auto-detect .env.example and .env.dist)')
  .option('--env-example <file>', 'alias for --env-template')
  .option('--format <format>', 'markdown or json', 'markdown')
  .option('--json', 'alias for --format json')
  .option('--strict', 'exit non-zero on warnings as well as critical findings')
  .option('--ci', 'CI mode: concise output and non-zero on critical findings')
  .action(async (options) => {
    const result = await scanProject(options.path, { envTemplate: options.envTemplate ?? options.envExample });
    const format = options.json ? 'json' : options.format;
    process.stdout.write(format === 'json' ? formatJson(result) : formatMarkdown(result));
    const shouldFail = result.summary.critical > 0 || Boolean(options.strict && result.summary.warning > 0);
    if (options.ci || options.strict) process.exitCode = shouldFail ? 1 : 0;
  });

program.parseAsync(process.argv.filter((arg, index) => index < 2 || arg !== '--'));
