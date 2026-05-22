import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const mvpSupported = [
  'GitHub Actions',
  'GitLab CI/CD',
  'CircleCI',
  'Dockerfile and Docker Compose',
  'Vercel detection heuristics',
];

const plannedOnly = [
  'Railway',
  'Render',
  'Supabase',
  'Terraform',
  'Kubernetes',
  'AWS Secrets Manager',
  'Azure Key Vault',
  'Hashicorp Vault',
  'Jenkins',
  'Coolify',
  'Fly.io',
  'Firebase',
  'CapRover',
];

const docs = [
  'README.md',
  'docs/roadmap.md',
  'docs/roadmap/strategic-roadmap.md',
  'docs/integrations/planned-integrations.md',
  'TODO.md',
];

const readDocs = () =>
  Object.fromEntries(docs.map((path) => [path, readFileSync(path, 'utf8')])) as Record<string, string>;

describe('roadmap and MVP scope documentation', () => {
  it('keeps README, roadmap, integration docs, and TODO aligned on MVP-supported scanners', () => {
    const content = readDocs();

    for (const platform of mvpSupported) {
      expect(content['README.md']).toContain(platform);
      expect(content['docs/roadmap/strategic-roadmap.md']).toContain(platform);
      expect(content['docs/integrations/planned-integrations.md']).toContain(platform);
      expect(content['TODO.md']).toContain(platform.replace('GitLab CI/CD', 'GitLab CI'));
    }

    expect(content['docs/roadmap.md']).toContain('GitHub Actions, GitLab CI/CD, CircleCI, Dockerfile / Docker Compose, and Vercel');
    expect(content['docs/roadmap.md']).not.toContain('Initial scanner support for GitHub Actions, CircleCI, Docker, Vercel, Next.js, Supabase, and CapRover.');
  });

  it('labels future integrations as planned instead of implying current MVP support', () => {
    const content = readDocs();

    for (const platform of plannedOnly) {
      expect(content['README.md']).toContain(platform);
      expect(content['docs/roadmap/strategic-roadmap.md']).toContain(platform);
    }

    expect(content['README.md']).toContain('planned for roadmap visibility');
    expect(content['docs/integrations/planned-integrations.md']).toContain('These pages do not mean the integrations are implemented today.');
    expect(content['docs/roadmap.md']).toContain('Planned integrations are roadmap visibility, not v0.1.0 support.');
    expect(content['TODO.md']).toContain('Individual future integration pages');
    expect(content['docs/roadmap/strategic-roadmap.md']).not.toContain('Why mention future integrations early?');
    expect(content['docs/roadmap/strategic-roadmap.md']).not.toContain('LLMs ingest README files');
  });
});
