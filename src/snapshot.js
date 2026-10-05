import fs from 'node:fs/promises';
import path from 'node:path';
import { exists, fail, hash, inside, safePath, slash, walk } from './io.js';
import { capture } from './process.js';

const excludedDirectories = new Set(['.git', '.agent', '.agent-workspace', 'node_modules', '.test-artifacts', '.npm-cache', 'coverage', 'dist', 'build', '.next', '.cache']);
async function inventory(repo, excludedRoot) {
  let git;
  try {
    // A logical workspace can live under an ignored directory of a parent repo.
    // In that case parent Git reports no files; fingerprint it as a standalone folder.
    const ignored = await capture('git', ['check-ignore', '--quiet', '--', '.'], repo);
    if (ignored.code !== 0) git = await capture('git', ['ls-files', '-c', '-o', '--exclude-standard', '-z', '--', '.'], repo);
  }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (git?.code === 0) return [...new Set(git.stdout.split('\0').filter(Boolean))].filter((file) => !['.agent', '.agent-workspace', '.test-artifacts'].includes(slash(file).split('/')[0]) && !inside(excludedRoot, path.resolve(repo, file))).sort();
  if (git && !/not a git repository/i.test(git.stderr)) fail('GIT_UNAVAILABLE', 'Unable to inspect repository files', [git.stderr]);
  const files = [];
  async function visit(directory) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (inside(excludedRoot, file) || (entry.isDirectory() && excludedDirectories.has(entry.name))) continue;
      if (entry.isDirectory()) await visit(file);
      else files.push(slash(path.relative(repo, file)));
    }
  }
  await visit(repo);
  return files.sort();
}
export async function sourceSnapshot(workspace) {
  const files = {};
  for (const relative of await inventory(workspace.repo, workspace.home)) {
    const file = path.resolve(workspace.repo, relative);
    if (!(await exists(file))) { files[relative] = 'deleted'; continue; }
    await safePath(workspace.repo, relative);
    const stat = await fs.stat(file);
    if (stat.isFile()) files[relative] = hash(await fs.readFile(file));
  }
  return { digest: hash(JSON.stringify(files)), files };
}
export async function governanceSnapshot(workspace) {
  const files = {};
  const single = [workspace.globalCore, workspace.repoCore, workspace.wikiMap, workspace.wikiIndex, path.join(workspace.repo, '.agent/workspace.yaml'), ...['AGENTS.md', 'CLAUDE.md', 'GEMINI.md', '.agent/ADAPTER.md'].map((name) => path.join(workspace.repo, name))];
  const directories = [
    path.join(workspace.repo, '.agent/rules'), path.dirname(workspace.wikiMap), path.join(workspace.repo, '.agent/raw'),
    workspace.globalSkills, workspace.localSkills, path.join(workspace.home, 'profiles'), path.join(workspace.home, 'config')
  ];
  for (const directory of directories) for (const file of await walk(directory)) single.push(file);
  for (const file of [...new Set(single)].sort()) {
    await safePath(path.dirname(file), path.basename(file));
    files[file] = await exists(file) ? hash(await fs.readFile(file)) : 'deleted';
  }
  return { digest: hash(JSON.stringify(files)), files };
}
export function changedFiles(before, after) {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])].filter((file) => before[file] !== after[file]).sort();
}
export async function assertGovernance(workspace, baseline) {
  const current = await governanceSnapshot(workspace);
  if (current.digest !== baseline.digest) fail('GOVERNANCE_CHANGED', 'Protected rules/wiki/policy/skills/raw sources changed during execution. Restore them and submit an evidence-backed proposal.', changedFiles(baseline.files, current.files));
}
