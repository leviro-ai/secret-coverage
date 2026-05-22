import type { Finding, ScanResult, Scanner, VariableSource } from './types.js';
import { scanEnvFiles } from './scanners/env-files.js';
import { scanGitHubActions } from './scanners/github-actions.js';
import { scanGitLabCI } from './scanners/gitlab-ci.js';
import { scanCircleCI } from './scanners/circleci.js';
import { scanDocker } from './scanners/docker.js';
import { scanVercel } from './scanners/vercel.js';
import { scanNextJs } from './scanners/nextjs.js';
import { scanSupabase } from './scanners/supabase.js';
import { scanCapRover } from './scanners/caprover.js';

const scanners: Scanner[] = [scanEnvFiles, scanGitHubActions, scanGitLabCI, scanCircleCI, scanDocker, scanVercel, scanNextJs, scanSupabase, scanCapRover];

const severityRank: Record<Finding['severity'], number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

function compareFindings(left: Finding, right: Finding): number {
  return severityRank[left.severity] - severityRank[right.severity]
    || left.variable.localeCompare(right.variable)
    || left.type.localeCompare(right.type)
    || (left.file ?? '').localeCompare(right.file ?? '');
}

function compareVariableSources(left: VariableSource, right: VariableSource): number {
  return left.variable.localeCompare(right.variable)
    || left.file.localeCompare(right.file)
    || left.source.localeCompare(right.source);
}

function uniqueBy(items: VariableSource[]): VariableSource[] {
  const seen = new Set<string>();
  return items.filter(item => {
    const key = `${item.variable}:${item.file}:${item.source}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function deriveFindings(declared: VariableSource[], referenced: VariableSource[]): Finding[] {
  const example = new Set(declared.filter(d => d.file === '.env.example').map(d => d.variable));
  const local = new Set(declared.filter(d => d.file !== '.env.example').map(d => d.variable));
  const refs = new Set(referenced.map(r => r.variable));
  const findings: Finding[] = [];

  for (const ref of referenced) {
    if (!example.has(ref.variable)) {
      findings.push({
        severity: 'critical',
        type: 'missing-from-example',
        variable: ref.variable,
        file: ref.file,
        message: `${ref.variable} is used in ${ref.file} but missing from .env.example.`,
        recommendation: `Add ${ref.variable}= to .env.example and configure the value in your deployment environment.`,
      });
    }
  }

  for (const variable of local) {
    if (!refs.has(variable) && !example.has(variable)) {
      findings.push({
        severity: 'warning',
        type: 'unused-local-variable',
        variable,
        message: `${variable} exists in a local env file but is not referenced by supported project configs.`,
        recommendation: `Remove ${variable} if obsolete, or add it to .env.example if it is required at runtime.`,
      });
    }
  }

  for (const variable of example) {
    if (!local.has(variable) && refs.has(variable)) {
      findings.push({
        severity: 'info',
        type: 'declared-not-local',
        variable,
        message: `${variable} is documented in .env.example but not present in local env files.`,
        recommendation: `Set ${variable} locally before running builds that require it.`,
      });
    }
  }

  const seen = new Set<string>();
  return findings.filter(f => {
    const key = `${f.severity}:${f.type}:${f.variable}:${f.file ?? ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function summarize(findings: Finding[]) {
  const critical = findings.filter(f => f.severity === 'critical').length;
  const warning = findings.filter(f => f.severity === 'warning').length;
  const info = findings.filter(f => f.severity === 'info').length;
  return { critical, warning, info, readinessScore: Math.max(0, 100 - critical * 25 - warning * 8 - info * 2) };
}

export async function scanProject(root = process.cwd()): Promise<ScanResult> {
  const results = await Promise.all(scanners.map(scanner => scanner({ root })));
  const declared = uniqueBy(results.flatMap(result => result.declared)).sort(compareVariableSources);
  const referenced = uniqueBy(results.flatMap(result => result.referenced)).sort(compareVariableSources);
  const findings = [...results.flatMap(result => result.findings), ...deriveFindings(declared, referenced)];
  const deduped = findings
    .filter((finding, index, all) => index === all.findIndex(other => `${other.severity}:${other.type}:${other.variable}:${other.file ?? ''}` === `${finding.severity}:${finding.type}:${finding.variable}:${finding.file ?? ''}`))
    .sort(compareFindings);
  return { findings: deduped, summary: summarize(deduped), declared, referenced };
}
