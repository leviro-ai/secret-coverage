import type { Finding, ScanOptions, ScanResult, Scanner, VariableSource } from './types.js';
import { scanEnvFiles } from './scanners/env-files.js';
import { scanGitHubActions } from './scanners/github-actions.js';
import { scanGitLabCI } from './scanners/gitlab-ci.js';
import { scanCircleCI } from './scanners/circleci.js';
import { scanJenkins } from './scanners/jenkins.js';
import { scanRailway } from './scanners/railway.js';
import { scanRender } from './scanners/render.js';
import { scanFly } from './scanners/fly.js';
import { scanFirebase } from './scanners/firebase.js';
import { scanCoolify } from './scanners/coolify.js';
import { scanDocker } from './scanners/docker.js';
import { scanVercel } from './scanners/vercel.js';
import { scanNextJs } from './scanners/nextjs.js';
import { scanSupabase } from './scanners/supabase.js';
import { scanCapRover } from './scanners/caprover.js';
import { scanTerraform } from './scanners/terraform.js';
import { scanKubernetes } from './scanners/kubernetes.js';
import { scanAwsSecrets } from './scanners/aws-secrets.js';
import { scanAzureKeyVault } from './scanners/azure-key-vault.js';
import { scanHashicorpVault } from './scanners/hashicorp-vault.js';

const scanners: Scanner[] = [scanEnvFiles, scanGitHubActions, scanGitLabCI, scanCircleCI, scanJenkins, scanRailway, scanRender, scanFly, scanFirebase, scanCoolify, scanDocker, scanVercel, scanNextJs, scanSupabase, scanCapRover, scanTerraform, scanKubernetes, scanAwsSecrets, scanAzureKeyVault, scanHashicorpVault];
const DEFAULT_ENV_TEMPLATE_FILES = ['.env.example', '.env.dist'];

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

function deriveFindings(declared: VariableSource[], referenced: VariableSource[], envTemplateFiles: string[], includeLocalEnvChecks: boolean): Finding[] {
  const templateFiles = new Set(envTemplateFiles);
  const template = new Set(declared.filter(d => templateFiles.has(d.file)).map(d => d.variable));
  const local = new Set(declared.filter(d => !templateFiles.has(d.file)).map(d => d.variable));
  const refs = new Set(referenced.map(r => r.variable));
  const findings: Finding[] = [];
  const templateLabel = envTemplateFiles.length === 1 ? envTemplateFiles[0] : 'an env template';

  for (const ref of referenced) {
    if (!template.has(ref.variable)) {
      findings.push({
        severity: 'critical',
        type: 'missing-from-template',
        variable: ref.variable,
        file: ref.file,
        message: `${ref.variable} is used in ${ref.file} but missing from ${templateLabel}.`,
        recommendation: `Add ${ref.variable}= to ${templateLabel} and configure the value in your deployment environment.`,
      });
    }
  }

  if (includeLocalEnvChecks) {
    for (const variable of local) {
      if (!refs.has(variable) && !template.has(variable)) {
        findings.push({
          severity: 'warning',
          type: 'unused-local-variable',
          variable,
          message: `${variable} exists in a local env file but is not referenced by supported project configs.`,
          recommendation: `Remove ${variable} if obsolete, or add it to your env template if it is required at runtime.`,
        });
      }
    }

    for (const variable of template) {
      if (!local.has(variable) && refs.has(variable)) {
        findings.push({
          severity: 'info',
          type: 'declared-not-local',
          variable,
          message: `${variable} is documented in an env template but not present in local env files.`,
          recommendation: `Set ${variable} locally before running builds that require it.`,
        });
      }
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

export async function scanProject(root = process.cwd(), options: ScanOptions = {}): Promise<ScanResult> {
  const envTemplateFiles = options.envTemplate ? [options.envTemplate] : DEFAULT_ENV_TEMPLATE_FILES;
  const explicitEnvTemplate = Boolean(options.envTemplate);
  const results = await Promise.all(scanners.map(scanner => scanner({ root, envTemplateFiles, explicitEnvTemplate })));
  const declared = uniqueBy(results.flatMap(result => result.declared)).sort(compareVariableSources);
  const referenced = uniqueBy(results.flatMap(result => result.referenced)).sort(compareVariableSources);
  const findings = [...results.flatMap(result => result.findings), ...deriveFindings(declared, referenced, envTemplateFiles, !explicitEnvTemplate)];
  const notices = [...new Set(results.flatMap(result => result.notices ?? []))];
  const deduped = findings
    .filter((finding, index, all) => index === all.findIndex(other => `${other.severity}:${other.type}:${other.variable}:${other.file ?? ''}` === `${finding.severity}:${finding.type}:${finding.variable}:${finding.file ?? ''}`))
    .sort(compareFindings);
  return { findings: deduped, summary: summarize(deduped), declared, referenced, notices };

}
