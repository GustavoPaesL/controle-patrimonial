import { mkdtempSync, copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const temp = mkdtempSync(join(tmpdir(), 'gitignore-task-2026-002-'));
const run = (args, input) => {
  const result = spawnSync('git', args, { cwd: temp, input, encoding: 'utf8' });
  if (result.error || result.status > 1) throw new Error(result.error?.message || result.stderr);
  return result;
};
run(['init', '--quiet']);
copyFileSync(join(root, '.gitignore'), join(temp, '.gitignore'));
const blocked = [
  'data/assets.json', 'data/nested/export.json', 'draft.tmp', 'nested/draft.tmp',
  'node_modules/pkg/index.js', 'nested/node_modules/pkg/index.js', '.npm/cache',
  '.cache/cache.json', 'coverage/index.html', '.nyc_output/run.json',
  'dist/app.js', 'build/app.js', 'chrome-qa-123/Default/Preferences',
  'reports/chrome-qa-123/profile', 'state.tsbuildinfo', 'app.log',
  'npm-debug.log.1', 'yarn-debug.log.1', 'yarn-error.log.1', 'pnpm-debug.log.1',
  '.env', '.env.local', '.env.production', '.env.test.local', 'nested/.env',
  'private.pem', 'private.key', 'cert.p12', 'cert.pfx', 'cert.jks', 'cert.keystore',
  'id_rsa', 'id_rsa.pub', 'id_ed25519', '.aws/credentials', '.ssh/config',
  '.npmrc', '.netrc', '_netrc', '.git-credentials', 'credentials.json',
  'credentials.local.json', 'service-account-test.json', 'service_account_test.json',
  '.codex/auth.json', '.codex/config.toml', '.codex/history.jsonl',
  '.codex/sessions/session.jsonl', '.codex/archived_sessions/old.jsonl',
  '.codex/log/log.txt', '.codex/tmp/tmp.json', '.codex/state.sqlite',
  '.codex/state.sqlite-wal', '.codex/state.db', '.vscode/settings.json',
  '.idea/workspace.xml', 'file.swp', 'file.swo', 'file~', '.DS_Store',
  'Thumbs.db', 'Desktop.ini',
];
const visible = [
  '.gitignore', 'server.mjs', 'public/app.js', 'public/styles.css',
  'public/index.html', 'package.json', 'test/server.test.mjs', 'README.md',
  'AGENTS.md', '.codex/agents/manager.toml', '.codex/agents/builder.toml',
  '.codex/agents/tester.toml', '.codex/skills/frontend-design-codex/SKILL.md',
  '.codex/skills/wealth-management-advisor/SKILL.md', '.env.example',
  '.env.local.example', '.env.sample', '.env.local.sample', '.env.template',
  '.env.local.template', 'nested/.env.example', 'reports/build-log.md',
  'reports/TASK-2026-001/screenshot.png', 'reports/TASK-2026-001/results.json',
  'reports/TASK-2026-001/browser-qa.mjs', 'reports/TASK-2026-001/round-01-manager.md',
  'reports/TASK-2026-002/round-01-tester.md', 'reports/TASK-2026-002/gitignore-qa.mjs',
];
for (const path of [...blocked, ...visible]) {
  if (path === '.gitignore') continue;
  mkdirSync(dirname(join(temp, path)), { recursive: true });
  writeFileSync(join(temp, path), 'synthetic fixture\n');
}
const ignored = new Set(run(['check-ignore', '--no-index', '--stdin'], [...blocked, ...visible].join('\n') + '\n').stdout.trim().split(/\r?\n/));
const listed = new Set(run(['ls-files', '--others', '--exclude-standard']).stdout.trim().split(/\r?\n/));
const failures = [
  ...blocked.filter(path => !ignored.has(path) || listed.has(path)).map(path => ({ path, expected: 'ignored' })),
  ...visible.filter(path => ignored.has(path) || !listed.has(path)).map(path => ({ path, expected: 'visible' })),
];
const result = { blockedCases: blocked.length, visibleCases: visible.length, failures, commands: ['git init --quiet (temporary repository)', 'git check-ignore --no-index --stdin', 'git ls-files --others --exclude-standard'], fixtures: { blocked, visible } };
writeFileSync(join(root, 'reports/TASK-2026-002/gitignore-qa-results.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ blockedCases: blocked.length, visibleCases: visible.length, failures }));
process.exitCode = failures.length ? 1 : 0;
