import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { stringify } from 'yaml';
import { exists, fail, frontmatter, hash, markdown, readYaml, requireId, safePath, validateSchema, writeManaged, writeNew } from './io.js';
import { loadWorkspace } from './workspace.js';
import { document, matchesPath, rulesInventory, skillInventory, wikiInventory } from './resolver.js';
import { readTask, validateTaskContent } from './tasks.js';
import { capture } from './process.js';
import { capturedSourceDrift, hasWikiVerification, verifyCapturedSources } from './knowledge.js';

export async function assertIdle(workspace) {
  if (await exists(await safePath(workspace.repo, '.agent/execution.lock'))) fail('EXECUTION_ACTIVE', 'An execution is active. Finish/stop it before maintenance or semantic task updates.');
}
async function maintenance(options) {
  if (!options.maintenance || !options.by?.trim()) fail('MAINTENANCE_AUTHORITY_REQUIRED', 'Knowledge CRUD requires explicitly authorized --maintenance --by <maintainer>. Executors use request-fix.');
  const workspace = await loadWorkspace(options);
  await assertIdle(workspace);
  return workspace;
}
export async function listTasks(options = {}) {
  const workspace = await loadWorkspace(options);
  const files = await fs.readdir(await safePath(workspace.repo, '.agent/tasks'));
  const results = [];
  for (const name of files.sort()) if (name.endsWith('.md')) {
    const task = await readTask(workspace, name.slice(0, -3));
    results.push({ id: task.metadata.id, status: task.metadata.status, risk: task.metadata.risk, version: task.metadata.version, file: task.file });
  }
  return results;
}
export async function showTask(id, options = {}) { const workspace = await loadWorkspace(options); return (await readTask(workspace, id)).text; }
export async function updateTask(id, options = {}) {
  if (!options.from) fail('MISSING_INPUT', 'Use --from <edited-contract.md>.');
  const workspace = await loadWorkspace(options);
  await assertIdle(workspace);
  const previous = await readTask(workspace, id);
  const input = frontmatter(await fs.readFile(path.resolve(options.from), 'utf8'), options.from);
  if (input.metadata.id !== id) fail('TASK_ID_MISMATCH', 'Task update must preserve its ID.');
  input.metadata.status = 'draft';
  input.metadata.version = previous.metadata.version + 1;
  delete input.metadata.approval;
  await validateSchema('task', input.metadata);
  validateTaskContent(input, { draft: true });
  await writeManaged(workspace.repo, '.agent/tasks/' + id + '.md', markdown(input.metadata, input.body));
  return { id, status: 'draft', version: input.metadata.version, next: 'Review concrete semantics, then task approve.' };
}
async function archive(workspace, relative, category) {
  const file = await safePath(workspace.repo, relative);
  const content = await fs.readFile(file);
  const archiveName = '.agent/archive/' + category + '/' + path.basename(file, '.md') + '-' + hash(content).slice(0, 16) + '.md';
  await writeNew(workspace.repo, archiveName, content);
  if (hash(await fs.readFile(await safePath(workspace.repo, archiveName))) !== hash(content)) fail('ARCHIVE_CONFLICT', 'Archive content differs; original was preserved.');
  await fs.unlink(file);
  return { deleted: relative, archived: archiveName };
}
export async function deleteTask(id, options = {}) {
  requireId(id);
  const workspace = await loadWorkspace(options);
  await assertIdle(workspace);
  await readTask(workspace, id);
  return archive(workspace, '.agent/tasks/' + id + '.md', 'tasks');
}
export async function newRule(id, options = {}) {
  requireId(id);
  const workspace = await maintenance(options);
  const metadata = { id, version: '0.1.0', level: 'specialist', status: 'draft', owner: options.by, paths: [], symbols: [], tags: [], capabilities: [] };
  const body = '# ' + id + '\n\nDefine the invariant, applicability, required evidence and failure condition. Release as active only after maintainer review.\n';
  const result = await writeNew(workspace.repo, '.agent/rules/' + id + '.md', markdown(metadata, body));
  if (!result.created) fail('ALREADY_EXISTS', 'Rule already exists: ' + id);
  return result;
}
export async function ruleById(workspace, id) {
  const rules = await rulesInventory(workspace);
  const matches = rules.filter((item) => item.id === id || item.file === path.resolve(workspace.repo, id));
  if (matches.length !== 1) fail('RULE_NOT_FOUND', 'Rule ID/path must identify exactly one rule: ' + id);
  return matches[0];
}
export async function showRule(id, options = {}) { return (await ruleById(await loadWorkspace(options), id)).text; }
export async function updateRule(id, options = {}) {
  if (!options.from) fail('MISSING_INPUT', 'Use --from <reviewed-rule.md>.');
  const workspace = await maintenance(options);
  const previous = await ruleById(workspace, id);
  if (previous.kind !== 'rule') fail('CORE_MAINTENANCE_SEPARATE', 'This CRUD command manages specialist/reference files. CORE changes need a separately authorized workspace release.');
  const input = frontmatter(await fs.readFile(path.resolve(options.from), 'utf8'), options.from);
  await validateSchema('document', input.metadata);
  if (input.metadata.id !== previous.id || !input.metadata.version || !input.metadata.level || !input.metadata.status || !input.body.trim()) fail('INVALID_RULE', 'Preserve ID and provide version, level, status and rule body.');
  if (previous.sha256 !== hash(input.text) && previous.metadata.version === input.metadata.version) fail('VERSION_NOT_BUMPED', 'Bump SemVer when releasing changed rule content.');
  if (input.metadata.status === 'active' && input.metadata.level === 'specialist' && !(input.metadata.paths?.length || input.metadata.scope?.length || input.metadata.tags?.length || input.metadata.symbols?.length)) fail('UNROUTABLE_RULE', 'Active specialist rules need path, symbol or tag applicability.');
  await writeManaged(workspace.repo, path.relative(workspace.repo, previous.file), markdown(input.metadata, input.body));
  return { id: previous.id, version: input.metadata.version, status: input.metadata.status, released_by: options.by };
}
export async function deleteRule(id, options = {}) {
  const workspace = await maintenance(options);
  const rule = await ruleById(workspace, id);
  if (rule.kind !== 'rule') fail('CANNOT_DELETE_CORE', 'CORE cannot be deleted through specialist-rule CRUD.');
  return { ...await archive(workspace, path.relative(workspace.repo, rule.file), 'rules'), retired_by: options.by };
}
export async function requestFix(kind, target, options = {}) {
  const workspace = await loadWorkspace(options);
  if (!options.reason || !options.proposedChange || !options.evidence?.length) fail('INCOMPLETE_PROPOSAL', 'Provide --reason, --proposed-change and one or more --evidence paths.');
  let doc;
  if (kind === 'rule') doc = await ruleById(workspace, target);
  else {
    const pages = await wikiInventory(workspace);
    doc = pages.find((page) => page.context === target || page.id === target || path.relative(path.dirname(workspace.wikiMap), page.file).replaceAll('\\', '/') === target);
    if (!doc) doc = await document(await safePath(path.dirname(workspace.wikiMap), target), 'wiki');
  }
  const artifacts = [];
  for (const relative of options.evidence) {
    const file = await safePath(workspace.repo, relative);
    artifacts.push({ artifact: relative, sha256: hash(await fs.readFile(file)) });
  }
  if (!['outdated', 'conflict', 'insufficient'].includes(options.type || 'outdated')) fail('INVALID_PROPOSAL_TYPE', 'Type must be outdated, conflict or insufficient.');
  const proposal = { version: 1, status: 'proposed', kind, target: doc.file, current_version: doc.metadata.version || null, current_sha256: doc.sha256, type: options.type || 'outdated', reason: options.reason, evidence: artifacts, proposed_change: options.proposedChange };
  const result = await writeNew(workspace.repo, '.agent/change-requests/' + kind + '-' + randomUUID() + '.yaml', stringify(proposal));
  return { ...result, proposal };
}
export async function doctor(options = {}) {
  const workspace = await loadWorkspace(options);
  const rules = await rulesInventory(workspace), wiki = await wikiInventory(workspace), skills = await skillInventory(workspace);
  const findings = [];
  for (const [name, tool] of Object.entries(workspace.config.tools)) if (tool.required && !tool.provider) findings.push({ severity: 'error', code: 'MISSING_CAPABILITY', message: 'Configure/connect tools.' + name + '.provider.' });
  for (const rule of rules) {
    if (rule.level === 'core' && rule.metadata.status && rule.metadata.status !== 'active') findings.push({ severity: 'error', code: 'INACTIVE_MANDATORY_RULE', message: rule.file });
    if (rule.level === 'specialist' && rule.metadata.status === 'active' && !(rule.metadata.paths?.length || rule.metadata.scope?.length || rule.metadata.symbols?.length || rule.metadata.tags?.length)) findings.push({ severity: 'error', code: 'UNROUTABLE_RULE', message: rule.file });
  }
  if (!wiki.some((page) => page.metadata.status === 'active')) findings.push({ severity: 'info', code: 'WIKI_NOT_RELEASED', message: 'New project: populate/verify draft knowledge through authorized onboarding.' });
  for (const page of wiki) if (page.metadata.status === 'active' && page.captured_source_drift.length) findings.push({ severity: 'warning', code: 'WIKI_SOURCE_DRIFT', message: page.id + ': captured sources changed/missing; excluded from auto context.', paths: page.captured_source_drift });
  if (!(await exists(await safePath(workspace.repo, '.agent/CORE.md')))) findings.push({ severity: 'error', code: 'MISSING_REPO_CORE', message: 'Missing repo CORE.' });
  return { ok: !findings.some((item) => item.severity === 'error'), repo: workspace.repo, home: workspace.home, inventory: { rules: rules.length, wiki: wiki.length, skills: skills.length }, findings, note: 'Doctor checks configuration and files. Verify live tool access and actual model selection in your harness.' };
}
export async function staleWiki(options = {}) {
  const workspace = await loadWorkspace(options), pages = await wikiInventory(workspace), results = [];
  for (const page of pages) {
    if (page.metadata.verified_sources?.length) {
      const affected = await capturedSourceDrift(workspace, page.metadata);
      results.push({ id: page.id, status: affected.length ? 'potentially-stale' : 'captured-sources-unchanged', affected, verification_scope: page.metadata.verification_scope, upstream: 'not-checked' });
      if (!page.metadata.verified_against) continue;
    }
    const revision = page.metadata.verified_against;
    if (!revision) { results.push({ id: page.id, status: 'unverified' }); continue; }
    const verified = await capture('git', ['rev-parse', '--verify', '--end-of-options', revision + '^{commit}'], workspace.repo);
    if (verified.code !== 0) { results.push({ id: page.id, status: 'unknown-revision' }); continue; }
    const changed = await capture('git', ['diff', '--name-only', verified.stdout.trim(), '--', '.'], workspace.repo);
    const untracked = await capture('git', ['ls-files', '-o', '--exclude-standard'], workspace.repo);
    const candidates = [...changed.stdout.split('\n'), ...untracked.stdout.split('\n')].filter(Boolean);
    const affected = candidates.filter((file) => page.metadata.scope.some((pattern) => matchesPath(file, pattern)));
    results.push({ id: page.id, status: !page.metadata.scope.length ? 'scope-not-defined' : affected.length ? 'potentially-stale' : 'no-scoped-drift', affected });
  }
  return results;
}
export async function newWiki(id, options = {}) {
  requireId(id);
  const workspace = await maintenance(options);
  const root = path.dirname(workspace.wikiMap);
  const map = await readYaml(workspace.wikiMap);
  if (Object.hasOwn(map.contexts, id)) fail('ALREADY_EXISTS', 'Wiki context exists: ' + id);
  const relative = 'contexts/' + id + '.md';
  const metadata = { id, version: '0.1.0', released_at: '', status: 'draft', owner: options.by, scope: [], verified_against: '' };
  const result = await writeNew(root, relative, markdown(metadata, '# ' + id + '\n\nRecord a bounded context, source links, contracts and verification entry points before release.'));
  if (!result.created) fail('ALREADY_EXISTS', 'Wiki page exists: ' + result.file);
  map.contexts[id] = { file: relative, description: options.description || id, paths: [], symbols: [], tags: [], related: [] };
  await writeManaged(workspace.repo, path.relative(workspace.repo, workspace.wikiMap), stringify(map));
  return result;
}
async function wikiById(workspace, id) {
  const page = (await wikiInventory(workspace)).find((item) => item.context === id || item.id === id);
  if (!page) fail('WIKI_NOT_FOUND', 'Wiki context is not in MAP.yaml: ' + id);
  return page;
}
export async function showWiki(id, options = {}) { return (await wikiById(await loadWorkspace(options), id)).text; }
export async function updateWiki(id, options = {}) {
  if (!options.from) fail('MISSING_INPUT', 'Use --from <reviewed-wiki-page.md>.');
  const workspace = await maintenance(options);
  const previous = await wikiById(workspace, id);
  const input = frontmatter(await fs.readFile(path.resolve(options.from), 'utf8'), options.from);
  await validateSchema('document', input.metadata);
  for (const key of ['id', 'version', 'released_at', 'status', 'owner', 'scope', 'verified_against']) if (!(key in input.metadata)) fail('INVALID_WIKI_PAGE', 'Missing ' + key);
  if (input.metadata.id !== previous.id || !input.body.trim()) fail('INVALID_WIKI_PAGE', 'Preserve page ID and provide substantive content.');
  if (previous.sha256 !== hash(input.text) && input.metadata.version === previous.metadata.version) fail('VERSION_NOT_BUMPED', 'Bump the version for changed knowledge.');
  if (input.metadata.status === 'active') {
    if (!hasWikiVerification(input.metadata)) fail('UNVERIFIED_WIKI', 'Active pages need a release date and reviewed revision or captured source hashes.');
    await verifyCapturedSources(workspace, input.metadata);
  }
  const map = await readYaml(workspace.wikiMap);
  const routing = map.contexts[previous.context];
  routing.paths = input.metadata.scope;
  if (options.description) routing.description = options.description;
  if (options.tags) routing.tags = options.tags;
  if (options.symbols) routing.symbols = options.symbols;
  await validateSchema('wiki-map', map);
  await writeManaged(workspace.repo, path.relative(workspace.repo, previous.file), markdown(input.metadata, input.body));
  await writeManaged(workspace.repo, path.relative(workspace.repo, workspace.wikiMap), stringify(map));
  return { id: previous.context, version: input.metadata.version, status: input.metadata.status, released_by: options.by };
}
export async function deleteWiki(id, options = {}) {
  const workspace = await maintenance(options), page = await wikiById(workspace, id);
  const map = await readYaml(workspace.wikiMap);
  delete map.contexts[page.context];
  for (const entry of Object.values(map.contexts)) entry.related = (entry.related || []).filter((value) => value !== page.context);
  const result = await archive(workspace, path.relative(workspace.repo, page.file), 'wiki');
  await writeManaged(workspace.repo, path.relative(workspace.repo, workspace.wikiMap), stringify(map));
  return result;
}
export async function inspectRepo(options = {}) {
  const workspace = await loadWorkspace(options);
  return { repo: workspace.repo, home: workspace.home, config: workspace.config, tasks: await listTasks(options), doctor: await doctor(options) };
}
