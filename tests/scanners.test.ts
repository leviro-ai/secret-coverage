import { describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { scanGitHubActions } from '../src/scanners/github-actions.js';
import { scanGitLabCI } from '../src/scanners/gitlab-ci.js';
import { scanCircleCI } from '../src/scanners/circleci.js';
import { scanJenkins } from '../src/scanners/jenkins.js';
import { scanRailway } from '../src/scanners/railway.js';
import { scanRender } from '../src/scanners/render.js';
import { scanFly } from '../src/scanners/fly.js';
import { scanDocker } from '../src/scanners/docker.js';
import { scanVercel } from '../src/scanners/vercel.js';
import { scanNextJs } from '../src/scanners/nextjs.js';
import { scanSupabase } from '../src/scanners/supabase.js';
import { scanCapRover } from '../src/scanners/caprover.js';
import type { Scanner } from '../src/types.js';

function fixture(files: Record<string, string>) {
  const root = mkdtempSync(join(tmpdir(), 'secret-coverage-scanner-'));
  for (const [relative, content] of Object.entries(files)) {
    const full = join(root, relative);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
  return root;
}

async function variables(scanner: Scanner, files: Record<string, string>) {
  const root = fixture(files);
  const result = await scanner({ root });
  return result.referenced.map(reference => `${reference.variable}:${reference.file}:${reference.source}`).sort();
}

describe('platform scanners', () => {
  it('scans GitHub Actions workflow references', async () => {
    await expect(variables(scanGitHubActions, {
      '.github/workflows/deploy.yml': 'env:\n  NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}\n',
    })).resolves.toEqual(['NEXT_PUBLIC_API_URL:.github/workflows/deploy.yml:github-actions']);
  });

  it('scans GitLab CI config references', async () => {
    await expect(variables(scanGitLabCI, {
      '.gitlab-ci.yml': 'deploy:\n  script:\n    - echo $DATABASE_URL\n  variables:\n    NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}\n',
    })).resolves.toEqual([
      'DATABASE_URL:.gitlab-ci.yml:gitlab-ci',
      'NEXT_PUBLIC_API_URL:.gitlab-ci.yml:gitlab-ci',
    ]);
  });

  it('scans CircleCI config references', async () => {
    await expect(variables(scanCircleCI, {
      '.circleci/config.yml': 'jobs:\n  deploy:\n    steps:\n      - run: echo $DATABASE_URL\n',
    })).resolves.toEqual(['DATABASE_URL:.circleci/config.yml:circleci']);
  });

  it('scans CircleCI environment keys only when values require external configuration', async () => {
    await expect(variables(scanCircleCI, {
      '.circleci/config.yaml': 'version: 2.1\njobs:\n  deploy:\n    environment:\n      NEXT_PUBLIC_API_URL: ""\n      SUPABASE_ACCESS_TOKEN: $SUPABASE_ACCESS_TOKEN\n      SUPABASE_DB_PASSWORD: ${SUPABASE_DB_PASSWORD}\n      SUPABASE_CLI_VERSION: 2.98.2\n      SUPABASE_BETA_CLI_VERSION: beta\n      NODE_ENV: production\n    steps:\n      - run: npx --yes "supabase@${SUPABASE_CLI_VERSION}" && npx --yes "supabase@${SUPABASE_BETA_CLI_VERSION}"\n',
    })).resolves.toEqual([
      'NEXT_PUBLIC_API_URL:.circleci/config.yaml:circleci',
      'SUPABASE_ACCESS_TOKEN:.circleci/config.yaml:circleci',
      'SUPABASE_DB_PASSWORD:.circleci/config.yaml:circleci',
    ]);
  });

  it('scans Jenkinsfile shell environment references', async () => {
    await expect(variables(scanJenkins, {
      Jenkinsfile: "pipeline { stages { stage('Deploy') { steps { sh 'deploy --url ${DATABASE_URL} --token $DEPLOY_TOKEN' } } } } }\n",
    })).resolves.toEqual([
      'DATABASE_URL:Jenkinsfile:jenkins',
      'DEPLOY_TOKEN:Jenkinsfile:jenkins',
    ]);
  });

  it('ignores common Jenkins-provided variables', async () => {
    await expect(variables(scanJenkins, {
      Jenkinsfile: "pipeline { stages { stage('Info') { steps { sh 'echo $BUILD_NUMBER $JOB_NAME $WORKSPACE $BRANCH_NAME' } } } } }\n",
    })).resolves.toEqual([]);
  });

  it('scans Railway config command environment references', async () => {
    await expect(variables(scanRailway, {
      'railway.toml': '[deploy]\nstartCommand = "node server.js --database ${DATABASE_URL} --token $DEPLOY_TOKEN"\n',
    })).resolves.toEqual([
      'DATABASE_URL:railway.toml:railway',
      'DEPLOY_TOKEN:railway.toml:railway',
    ]);
  });

  it('scans Render config env references and external env keys', async () => {
    await expect(variables(scanRender, {
      'render.yaml': 'services:\n  - type: web\n    name: api\n    buildCommand: pnpm build --token $BUILD_TOKEN\n    envVars:\n      - key: DATABASE_URL\n        sync: false\n      - key: NODE_VERSION\n        value: 22\n',
    })).resolves.toEqual([
      'BUILD_TOKEN:render.yaml:render',
      'DATABASE_URL:render.yaml:render',
    ]);
  });

  it('scans Fly.io config env references and secret placeholders', async () => {
    await expect(variables(scanFly, {
      'fly.toml': 'app = "secret-coverage-api"\n[build]\n  build-target = "${BUILD_TARGET}"\n[env]\n  NODE_ENV = "production"\n  DATABASE_URL = "${DATABASE_URL}"\n  API_BASE_URL = "https://example.com"\n[deploy]\n  release_command = "pnpm migrate --token $DEPLOY_TOKEN"\n',
    })).resolves.toEqual([
      'BUILD_TARGET:fly.toml:fly',
      'DATABASE_URL:fly.toml:fly',
      'DEPLOY_TOKEN:fly.toml:fly',
    ]);
  });

  it('scans Dockerfile and Compose references', async () => {
    await expect(variables(scanDocker, {
      Dockerfile: 'ENV DATABASE_URL=${DATABASE_URL}\n',
      'docker-compose.yml': 'services:\n  web:\n    environment:\n      - REDIS_URL=${REDIS_URL}\n',
    })).resolves.toEqual([
      'DATABASE_URL:Dockerfile:docker',
      'REDIS_URL:docker-compose.yml:docker',
    ]);
  });

  it('scans Vercel env object keys as deployment variables', async () => {
    await expect(variables(scanVercel, {
      'vercel.json': '{ "env": { "NEXT_PUBLIC_API_URL": "@next_public_api_url" } }',
    })).resolves.toEqual(['NEXT_PUBLIC_API_URL:vercel.json:vercel']);
  });

  it('scans Next.js config and source references', async () => {
    await expect(variables(scanNextJs, {
      'next.config.js': 'module.exports = { env: { NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL } }',
      'src/page.tsx': 'export const token = process.env?.DEPLOY_TOKEN;',
    })).resolves.toEqual([
      'DEPLOY_TOKEN:src/page.tsx:nextjs',
      'NEXT_PUBLIC_API_URL:next.config.js:nextjs',
    ]);
  });

  it('does not scan normal Next.js source identifiers as env references', async () => {
    await expect(variables(scanNextJs, {
      'src/payments/catalog.ts': 'const path = `${context}:${eventName}:${checkoutSessionPlaceholder}`; const value = options.env.context;',
    })).resolves.toEqual([]);
  });

  it('scans Supabase config references', async () => {
    await expect(variables(scanSupabase, {
      'supabase/config.toml': 'api_url = "${SUPABASE_URL}"\n',
    })).resolves.toEqual(['SUPABASE_URL:supabase/config.toml:supabase']);
  });

  it('scans CapRover captain definition references', async () => {
    await expect(variables(scanCapRover, {
      'captain-definition': '{ "schemaVersion": 2, "dockerfileLines": ["ENV API_URL=${API_URL}"] }',
    })).resolves.toEqual(['API_URL:captain-definition:caprover']);
  });
});
