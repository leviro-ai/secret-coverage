import type { Finding, ScanResult } from './types.js';

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

function sortedFindings(findings: Finding[]): Finding[] {
  return [...findings].sort(compareFindings);
}

function stableResult(result: ScanResult): ScanResult {
  return {
    ...result,
    findings: sortedFindings(result.findings),
    declared: result.declared.map(({ variable, file, source }) => ({ variable, file, source })),
    referenced: result.referenced.map(({ variable, file, source }) => ({ variable, file, source })),
    notices: [...(result.notices ?? [])].sort(),
  };
}

export function formatJson(result: ScanResult): string {
  return `${JSON.stringify(stableResult(result), null, 2)}\n`;
}

export function formatMarkdown(result: ScanResult): string {
  const stable = stableResult(result);
  const lines = [
    '# EnvGuard Report',
    '',
    `Readiness score: **${stable.summary.readinessScore}/100**`,
    '',
    `Critical: ${stable.summary.critical} · Warning: ${stable.summary.warning} · Info: ${stable.summary.info}`,
    '',
  ];

  if (stable.notices.length) {
    lines.push('## Notices');
    lines.push('');
    for (const notice of stable.notices) lines.push(`- ${notice}`);
    lines.push('');
  }

  if (stable.findings.length === 0) {
    lines.push('✅ No deployment-blocking environment variable issues detected.');
    return `${lines.join('\n')}\n`;
  }

  for (const severity of ['critical', 'warning', 'info'] as const) {
    const findings = stable.findings.filter(f => f.severity === severity);
    if (!findings.length) continue;
    lines.push(`## ${severity[0].toUpperCase()}${severity.slice(1)}`);
    lines.push('');
    for (const finding of findings) {
      lines.push(`- **${finding.variable}** — ${finding.message}`);
      const context = [finding.file ? `\`${finding.file}\`` : null, `\`${finding.type}\``]
        .filter(Boolean)
        .join(' · ');
      lines.push(`  - Context: ${context}`);
      if (finding.recommendation) lines.push(`  - Fix: ${finding.recommendation}`);
    }
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}
