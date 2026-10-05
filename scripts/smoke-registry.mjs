import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import spawn from 'cross-spawn';

const root = fileURLToPath(new URL('../', import.meta.url));
const identity = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
const filename = identity.name.replace(/^@/, '').replace('/', '-') + '-' + identity.version + '.tgz';
const tarball = await fs.readFile(path.join(root, filename));
// Test an actual consumer outside this package's npm prefix, rather than
// allowing npm exec to mistake the source package for an installed dependency.
const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'agent-workspace-registry-'));
let base, downloads = 0;
const server = http.createServer((request, response) => {
  const route = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  if (request.method !== 'GET') { response.writeHead(405).end(); return; }
  if (route === '/-/' + filename) {
    downloads++;
    response.writeHead(200, { 'content-type': 'application/octet-stream' }).end(tarball);
  } else if (route === '/' + identity.name) {
    const version = { ...identity, dist: { tarball: base + '/-/' + filename, shasum: createHash('sha1').update(tarball).digest('hex'), integrity: 'sha512-' + createHash('sha512').update(tarball).digest('base64') } };
    response.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ name: identity.name, 'dist-tags': { latest: identity.version }, versions: { [identity.version]: version } }));
  } else {
    response.writeHead(302, { location: 'https://registry.npmjs.org' + request.url }).end();
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
base = 'http://127.0.0.1:' + server.address().port;

async function run(command, args, cwd, cache, home) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, shell: false, windowsHide: true, env: { ...process.env, AGENT_WORKSPACE_HOME: home, npm_config_registry: base, npm_config_cache: cache, npm_config_audit: 'false', npm_config_fund: 'false' }, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    const timer = setTimeout(() => { child.kill(); reject(new Error(command + ' exceeded the smoke-test timeout.')); }, 120000);
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', (error) => { clearTimeout(timer); reject(error); });
    child.on('close', (code) => { clearTimeout(timer); code === 0 ? resolve(stdout) : reject(new Error(command + ' failed:\n' + stderr)); });
  });
}
const specifier = identity.name + '@' + identity.version;
const repo = path.join(directory, 'first-machine'), copied = path.join(directory, 'second-machine');
const cache = path.join(directory, 'first-cache'), freshCache = path.join(directory, 'second-cache');
const home = path.join(directory, 'first-home'), freshHome = path.join(directory, 'second-home');
try {
  await fs.mkdir(repo);
  const prefix = ['--yes', '--package', specifier, 'agent-workspace'];
  const initialized = JSON.parse(await run('npx', ['--yes', specifier, 'init', '--with', 'codex', '--json'], repo, cache, home));
  assert.equal(initialized.repo.repo, repo);
  const router = await fs.readFile(path.join(repo, 'AGENTS.md'), 'utf8');
  assert.ok(router.includes('npx --yes --package "' + specifier + '" agent-workspace'));
  assert.ok(!router.includes(root.replaceAll('\\', '/')));
  await fs.cp(repo, copied, { recursive: true });
  await run('npx', [...prefix, 'setup', '--json'], copied, freshCache, freshHome);
  const checked = JSON.parse(await run('npx', [...prefix, 'doctor', '--json'], copied, freshCache, freshHome));
  assert.equal(checked.ok, true);
  assert.equal(checked.repo, copied);
  assert.equal(checked.home, freshHome);
  const globalPrefix = path.join(directory, 'global-install');
  await run('npm', ['install', '--global', '--prefix', globalPrefix, '--ignore-scripts', specifier], root, freshCache, freshHome);
  const binary = process.platform === 'win32' ? path.join(globalPrefix, 'agent-workspace.cmd') : path.join(globalPrefix, 'bin/agent-workspace');
  assert.equal((await run(binary, ['--version'], copied, freshCache, freshHome)).trim(), identity.version);
  const urlRepo = path.join(directory, 'url-consumer');
  await fs.mkdir(urlRepo);
  await run('npx', ['--yes', base + '/-/' + filename, 'init', '--with', 'gemini', '--distribution', 'github', '--json'], urlRepo, freshCache, freshHome);
  assert.ok((await fs.readFile(path.join(urlRepo, 'GEMINI.md'), 'utf8')).includes('https://github.com/qthan1004/agent-workspace-pipeline/releases/download/v' + identity.version));
  assert.ok(downloads >= 2, 'A separate npm cache must download the package independently.');
  console.log('Registry smoke passed: npm global install, npx init, copied workspace, fresh-cache download and doctor. Fixture: ' + directory);
} finally {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  assert.equal(path.dirname(directory), path.resolve(os.tmpdir()));
  assert.ok(path.basename(directory).startsWith('agent-workspace-registry-'));
  await fs.rm(directory, { recursive: true, force: true });
}
