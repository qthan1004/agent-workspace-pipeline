import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stringify } from 'yaml';
import * as api from '../src/index.js';
import { exists, frontmatter, inside, markdown, readYaml, safePath } from '../src/io.js';
import { readTask, sections } from '../src/tasks.js';
import { governanceSnapshot, sourceSnapshot } from '../src/snapshot.js';
import { capture } from '../src/process.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const testRoot = path.join(root, '.test-artifacts');
const rejects = (work, code) => assert.rejects(work, (error) => error.code === code);
async function fixture(t) {
  await fs.mkdir(testRoot, { recursive: true });
  const directory = await fs.mkdtemp(path.join(testRoot, 'pipeline-'));
  t.after(async () => {
    assert.ok(inside(testRoot, directory) && directory !== testRoot);
    await fs.rm(directory, { recursive: true, force: true });
  });
  const options = { repo: path.join(directory, 'repo'), home: path.join(directory, 'home') };
  await api.bootstrap(options);
  const write = async (relative, content) => {
    const file = await safePath(options.repo, relative);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, content);
    return file;
  };
  return { directory, options, write, workspace: await api.loadWorkspace(options) };
}
async function approved(f, id = 'DEMO-1', edit = () => {}) {
  await api.newTask(id, f.options);
  const original = await readTask(f.workspace, id);
  const metadata = { ...original.metadata, risk: 'low', paths: ['src/value.mjs'], tags: ['regression'], expected_write_scope: ['src/**'], acceptance_criteria: [{ id: 'AC1', description: 'The helper returns the requested value.' }], dod: [{ id: 'D1', criterion: 'Requested behavior and change surface verified.', acceptance: ['AC1'], evidence: ['E4', 'E5'] }] };
  metadata.discovery = { status: 'ready', outcome: 'Return the requested value.', sources: [{ kind: 'conversation', reference: 'Fixture request', summary: 'Add a private value helper.' }, { kind: 'source', reference: 'Fixture empty source inventory', summary: 'No existing helper or callers.' }], flow: 'New private value helper -> direct consumer test; no existing state or alternate callers.', decisions: [{ decision: 'Use an ESM helper.', basis: 'agent', reference: 'Private Node fixture implementation choice.' }], open_questions: [] };
  edit(metadata);
  const body = sections.map((section) => '# ' + section + '\n' + (section === 'Goal' ? 'Implement and verify the value helper.' : 'Concrete agreed constraints; frontmatter defines canonical checks.')).join('\n\n');
  await f.write('.agent/tasks/' + id + '.md', markdown(metadata, body));
  await api.approveTask(id, { ...f.options, by: 'fixture-human' });
  return id;
}
async function passingReceipt(f, id) {
  await api.evidenceInit(id, f.options);
  const delta = await api.evidenceChanges(id, f.options);
  await api.evidenceRecord(id, { ...f.options, kind: 'E4', artifact: delta.artifact, entry: 'diff', description: 'Changed files inspected.', result: 'passed' });
  await f.write('.agent/evidence/tests.txt', 'Observed test exit 0; behavior and regressions passed.');
  await api.evidenceRecord(id, { ...f.options, kind: 'E5', artifact: '.agent/evidence/tests.txt', entry: 'tests', description: 'Behavior tests passed.', result: 'passed' });
  const receiptPath = path.join(f.options.repo, '.agent/evidence/' + id + '.json');
  const receipt = JSON.parse(await fs.readFile(receiptPath, 'utf8'));
  receipt.implementation_complete = true;
  receipt.decisions = [{ change: 'Value helper', reason: 'The approved behavior requires this helper.' }];
  receipt.dod = [{ id: 'D1', evidence: ['diff', 'tests'] }];
  await fs.writeFile(receiptPath, JSON.stringify(receipt, null, 2));
  await f.write('.agent/evidence/review.txt', 'Fresh independent fixture review passed.');
  const snapshot = await api.evidenceSnapshot(id, f.options);
  await api.recordReview(id, { ...f.options, by: 'fixture-reviewer', artifact: '.agent/evidence/review.txt', result: 'passed', sourceDigest: snapshot.source_digest, contractSha256: snapshot.contract_sha256 });
  return { receiptPath, receipt: JSON.parse(await fs.readFile(receiptPath, 'utf8')) };
}

test('execution rejects a legacy contract without recorded intent discovery but permits inspection and revision', async (t) => {
  const f = await fixture(t), id = await approved(f, 'LEGACY');
  const task = await readTask(f.workspace, id);
  delete task.metadata.discovery;
  await f.write('.agent/tasks/' + id + '.md', markdown(task.metadata, task.body));
  assert.ok(await api.showTask(id, f.options));
  assert.equal((await api.prepare(id, { ...f.options, draft: true })).manifest.task.id, id);
  await rejects(api.approveTask(id, { ...f.options, by: 'agent' }), 'DISCOVERY_NOT_READY');
  await rejects(api.prepare(id, f.options), 'DISCOVERY_NOT_READY');
  await rejects(api.runTask(id, { ...f.options, dryRun: true }), 'DISCOVERY_NOT_READY');
  const from = path.join(f.directory, 'legacy-revision.md');
  await fs.writeFile(from, markdown(task.metadata, task.body));
  assert.equal((await api.updateTask(id, { ...f.options, from })).status, 'draft');
});
for (const scenario of ['pending', 'open-question', 'missing-request', 'missing-source', 'blank-flow', 'unsourced-decision']) {
  test('discovery gate rejects ' + scenario + ' even with an approver flag', async (t) => {
    const f = await fixture(t), id = await approved(f, 'DISCOVERY');
    const task = await readTask(f.workspace, id);
    const discovery = task.metadata.discovery;
    if (scenario === 'pending') discovery.status = 'pending';
    if (scenario === 'open-question') discovery.open_questions = ['Visual mockup or integrated application behavior?'];
    if (scenario === 'missing-request') discovery.sources = discovery.sources.filter((source) => source.kind === 'source');
    if (scenario === 'missing-source') discovery.sources = discovery.sources.filter((source) => source.kind === 'conversation');
    if (scenario === 'blank-flow') discovery.flow = '  ';
    if (scenario === 'unsourced-decision') discovery.decisions[0].reference = '  ';
    await f.write('.agent/tasks/' + id + '.md', markdown(task.metadata, task.body));
    await rejects(api.approveTask(id, { ...f.options, by: 'user' }), 'DISCOVERY_NOT_READY');
    await rejects(api.runTask(id, { ...f.options, dryRun: true }), 'DISCOVERY_NOT_READY');
    assert.equal((await api.prepare(id, { ...f.options, draft: true })).manifest.task.id, id);
    assert.equal(await exists(path.join(f.options.repo, '.agent/execution.lock')), false);
  });
}
test('discovery provenance is schema-checked and changing a decided outcome invalidates approval', async (t) => {
  const f = await fixture(t), id = await approved(f, 'PROVENANCE');
  const task = await readTask(f.workspace, id);
  task.metadata.discovery.decisions[0].basis = 'guess';
  await f.write('.agent/tasks/' + id + '.md', markdown(task.metadata, task.body));
  await rejects(api.approveTask(id, { ...f.options, by: 'user' }), 'SCHEMA_INVALID');
  task.metadata.discovery.decisions[0].basis = 'agent';
  task.metadata.discovery.outcome = 'A different requested outcome.';
  await f.write('.agent/tasks/' + id + '.md', markdown(task.metadata, task.body));
  await rejects(api.prepare(id, f.options), 'APPROVAL_STALE');
});

test('bootstrap preserves user work and is idempotent', async (t) => {
  const f = await fixture(t);
  await f.write('AGENTS.md', 'User instructions\n');
  await f.write('.agent/CORE.md', 'User invariant\n');
  await api.bootstrap(f.options);
  const instructions = await fs.readFile(path.join(f.options.repo, 'AGENTS.md'), 'utf8');
  assert.ok(instructions.startsWith('User instructions'));
  assert.equal(instructions.match(/agent-workspace:start/g).length, 1);
  await api.bootstrap(f.options);
  assert.equal(await fs.readFile(path.join(f.options.repo, 'AGENTS.md'), 'utf8'), instructions);
  assert.equal(await fs.readFile(path.join(f.options.repo, '.agent/CORE.md'), 'utf8'), 'User invariant\n');
  assert.equal((await api.doctor(f.options)).ok, true);
});
test('refresh updates recognized shipped defaults, preserves custom knowledge and respects active execution', async (t) => {
  const f = await fixture(t);
  const oldCore = (await fs.readFile(path.join(root, 'test/fixtures/core-0.2.1.md'), 'utf8')).replaceAll('\r\n', '\n');
  const currentCore = await fs.readFile(path.join(root, 'templates/global/core/CORE.md'), 'utf8');
  const globalCore = path.join(f.options.home, 'core/CORE.md');
  const oldInterview = await fs.readFile(path.join(root, 'test/fixtures/interview-0.2.1.md'), 'utf8');
  const currentInterview = await fs.readFile(path.join(root, 'templates/global/skills/interview/SKILL.md'), 'utf8');
  await fs.writeFile(path.join(f.options.home, 'skills/interview/SKILL.md'), oldInterview);
  await f.write('.agent/skills/plan/SKILL.md', oldInterview.replace('name: interview', 'name: plan'));
  await f.write('.agent/skills/interview/SKILL.md', oldInterview);
  await api.bootstrap({ ...f.options, refresh: true });
  assert.equal(await fs.readFile(path.join(f.options.home, 'skills/interview/SKILL.md'), 'utf8'), currentInterview);
  assert.equal(await fs.readFile(path.join(f.options.repo, '.agent/skills/interview/SKILL.md'), 'utf8'), currentInterview);
  assert.equal(await fs.readFile(path.join(f.options.repo, '.agent/skills/plan/SKILL.md'), 'utf8'), oldInterview.replace('name: interview', 'name: plan'));
  await fs.writeFile(globalCore, oldCore.replaceAll('\n', '\r\n'));
  await f.write('.agent/skills/interview/SKILL.md', '# Customized interview\nKeep my project procedure.\n');
  await api.bootstrap(f.options);
  assert.equal(await fs.readFile(globalCore, 'utf8'), oldCore.replaceAll('\n', '\r\n'));
  const refreshed = await api.bootstrap({ ...f.options, refresh: true });
  assert.equal(await fs.readFile(globalCore, 'utf8'), currentCore);
  assert.ok(refreshed.global.updated > 0);
  assert.ok(refreshed.repo.skills.customized.includes('.agent/skills/interview/SKILL.md'));
  assert.equal(await fs.readFile(path.join(f.options.repo, '.agent/skills/interview/SKILL.md'), 'utf8'), '# Customized interview\nKeep my project procedure.\n');
  const second = await api.bootstrap({ ...f.options, refresh: true });
  assert.equal(second.global.updated, 0);
  assert.equal(second.repo.skills.updated, 0);
  await fs.writeFile(globalCore, oldCore);
  await f.write('.agent/execution.lock', 'active');
  await rejects(api.bootstrap({ ...f.options, refresh: true }), 'EXECUTION_ACTIVE');
  assert.equal(await fs.readFile(globalCore, 'utf8'), oldCore);
});
test('scaffold cannot be approved/executed; draft prepare is available', async (t) => {
  const f = await fixture(t);
  await api.newTask('NEW', f.options);
  await rejects(api.approveTask('NEW', { ...f.options, by: 'human' }), 'INVALID_CONTRACT');
  assert.equal((await api.prepare('NEW', { ...f.options, draft: true })).manifest.task.status, 'draft');
  await rejects(api.runTask('NEW', { ...f.options, dryRun: true }), 'INVALID_CONTRACT');
  await rejects(api.newTask('../escape', f.options), 'INVALID_ID');
});
test('approval binds semantics and repeat prepare preserves original source baseline', async (t) => {
  const f = await fixture(t), id = await approved(f);
  const initial = await api.prepare(id, f.options);
  await f.write('src/value.mjs', 'export const value = 42;\n');
  assert.equal((await api.prepare(id, f.options)).manifest.source.digest, initial.manifest.source.digest);
  await fs.appendFile(path.join(f.options.repo, '.agent/tasks/' + id + '.md'), '\nNew semantic constraint.\n');
  await rejects(api.prepare(id, f.options), 'APPROVAL_STALE');
});
test('task update increments version, resets approval and delete archives', async (t) => {
  const f = await fixture(t), id = await approved(f);
  const from = path.join(f.directory, 'contract.md');
  await fs.writeFile(from, await api.showTask(id, f.options));
  assert.equal((await api.updateTask(id, { ...f.options, from })).version, 2);
  assert.equal((await api.listTasks(f.options))[0].status, 'draft');
  await rejects(api.prepare(id, f.options), 'TASK_NOT_APPROVED');
  const removed = await api.deleteTask(id, f.options);
  assert.ok(await exists(path.join(f.options.repo, removed.archived)));
  assert.equal((await api.listTasks(f.options)).length, 0);
});
test('resolver keeps mandatory rules, path priority, wiki limit and draft exclusion', async (t) => {
  const f = await fixture(t);
  await f.write('.agent/rules/plain.md', 'Mandatory plain rule.');
  await f.write('.agent/rules/value.md', markdown({ id: 'value-rule', level: 'specialist', version: '1.0.0', status: 'active', paths: ['src/**/*.mjs'] }, '# Inspect callers.'));
  const contexts = {};
  for (const [id, routing] of [['exact', { paths: ['src/value.mjs'] }], ['symbol', { symbols: ['value'] }], ['tag', { tags: ['value'] }], ['related', {}], ['draft', { paths: ['src/value.mjs'] }]]) {
    contexts[id] = { file: 'contexts/' + id + '.md', description: id === 'related' ? '' : 'value', ...routing, related: id === 'exact' ? ['related'] : [] };
    await f.write('wiki/contexts/' + id + '.md', markdown({ id, version: '1.0.0', status: id === 'draft' ? 'draft' : 'active', owner: 'owner', scope: [], released_at: '2026-10-05', verified_against: 'abc1234' }, '# Context ' + id));
  }
  await f.write('wiki/MAP.yaml', stringify({ version: 1, contexts }));
  const context = await api.resolveContext(f.workspace, api.queryInput('value', { paths: ['src/value.mjs'], symbols: ['value'], tags: ['value'] }));
  assert.deepEqual(context.wiki.map((item) => item.context), ['exact', 'symbol', 'tag']);
  assert.ok(context.rules.some((item) => item.id === 'plain'));
  assert.ok(context.rules.some((item) => item.id === 'value-rule'));
});
test('local skills override global; unknown explicit skills fail', async (t) => {
  const f = await fixture(t);
  await f.write('.agent/skills/tdd/SKILL.md', markdown({ name: 'tdd', description: 'Local test convention.' }, '# Use project command.'));
  const context = await api.resolveContext(f.workspace, api.queryInput('', { skills: ['tdd'] }));
  assert.equal(context.skills.length, 1);
  assert.equal(context.skills[0].scope, 'local');
  await rejects(api.resolveContext(f.workspace, api.queryInput('', { skills: ['missing'] })), 'SKILL_NOT_FOUND');
});
test('missing semantic provider blocks execution', async (t) => {
  const f = await fixture(t), id = await approved(f, 'TYPED', (metadata) => { metadata.paths = ['src/value.ts']; metadata.required_evidence.push('E1'); });
  assert.ok((await api.runTask(id, { ...f.options, dryRun: true })).blockers.some((item) => item.includes('typescript_semantic')));
  await rejects(api.runTask(id, f.options), 'MISSING_CAPABILITY');
});
test('governance changes cannot be forgiven by rerunning prepare', async (t) => {
  const f = await fixture(t), id = await approved(f);
  await api.prepare(id, f.options);
  await f.write('.agent/rules/new.md', 'Mandatory invariant.');
  await rejects(api.evidenceSnapshot(id, f.options), 'GOVERNANCE_CHANGED');
  await rejects(api.prepare(id, f.options), 'GOVERNANCE_CHANGED');
});
test('valid evidence finishes task and source drift invalidates finished evidence', async (t) => {
  const f = await fixture(t), id = await approved(f);
  await api.prepare(id, f.options);
  await f.write('src/value.mjs', 'export const value = 42;\n');
  await passingReceipt(f, id);
  assert.equal((await api.finishTask(id, f.options)).status, 'done');
  assert.equal((await api.validateEvidence(id, f.options)).valid, true);
  await f.write('src/value.mjs', 'export const value = 43;\n');
  await rejects(api.validateEvidence(id, f.options), 'EVIDENCE_GATE_FAILED');
});
for (const scenario of ['missing-review', 'changed-artifact', 'empty-artifact', 'missing-dod', 'semantic-expansion']) {
  test('evidence gate rejects ' + scenario, async (t) => {
    const f = await fixture(t), id = await approved(f);
    await api.prepare(id, f.options);
    const { receiptPath, receipt } = await passingReceipt(f, id);
    let code = 'EVIDENCE_GATE_FAILED';
    if (scenario === 'missing-review') delete receipt.review;
    if (scenario === 'missing-dod') receipt.dod[0].evidence = ['diff'];
    if (scenario === 'semantic-expansion') { receipt.scope_expansions = [{ kind: 'semantic', reason: 'Invented business change', paths: ['src/value.mjs'] }]; code = 'SCHEMA_INVALID'; }
    if (scenario === 'changed-artifact') { await f.write('.agent/evidence/tests.txt', 'Modified'); code = 'ARTIFACT_CHANGED'; }
    if (scenario === 'empty-artifact') { await f.write('.agent/evidence/tests.txt', ''); code = 'EMPTY_ARTIFACT'; }
    await fs.writeFile(receiptPath, JSON.stringify(receipt));
    await rejects(api.validateEvidence(id, f.options), code);
  });
}
test('outside-scope mechanical changes need exact paths and explanation', async (t) => {
  const f = await fixture(t), id = await approved(f);
  await api.prepare(id, f.options);
  await f.write('outside.mjs', 'configuration');
  const { receiptPath, receipt } = await passingReceipt(f, id);
  await rejects(api.validateEvidence(id, f.options), 'EVIDENCE_GATE_FAILED');
  receipt.scope_expansions = [{ kind: 'mechanical', reason: 'Necessary local wiring.', paths: ['outside.mjs'] }];
  await fs.writeFile(receiptPath, JSON.stringify(receipt));
  assert.equal((await api.validateEvidence(id, f.options)).valid, true);
});
test('old independent review cannot be restamped as current', async (t) => {
  const f = await fixture(t), id = await approved(f);
  await api.prepare(id, f.options);
  await api.evidenceInit(id, f.options);
  const snapshot = await api.evidenceSnapshot(id, f.options);
  await f.write('src/value.mjs', 'changed');
  await f.write('.agent/evidence/review.txt', 'Old review.');
  await rejects(api.recordReview(id, { ...f.options, by: 'reviewer', artifact: '.agent/evidence/review.txt', result: 'passed', sourceDigest: snapshot.source_digest, contractSha256: snapshot.contract_sha256 }), 'REVIEW_STALE');
});
test('rule CRUD requires authorized maintenance; proposals leave rules untouched', async (t) => {
  const f = await fixture(t), opts = { ...f.options, maintenance: true, by: 'owner' };
  await rejects(api.newRule('api', f.options), 'MAINTENANCE_AUTHORITY_REQUIRED');
  await api.newRule('api', opts);
  const candidate = frontmatter(await api.showRule('api', opts));
  candidate.metadata.version = '1.0.0'; candidate.metadata.status = 'active'; candidate.metadata.paths = ['src/api/**'];
  const from = path.join(f.directory, 'api.md');
  await fs.writeFile(from, markdown(candidate.metadata, '# API contract\nMUST inspect callers.'));
  await api.updateRule('api', { ...opts, from });
  const before = await api.showRule('api', opts);
  await f.write('.agent/evidence/source.txt', 'Observed contract.');
  await api.requestFix('rule', 'api', { ...f.options, reason: 'Stale', evidence: ['.agent/evidence/source.txt'], proposedChange: 'Clarify.' });
  assert.equal(await api.showRule('api', opts), before);
  assert.ok((await api.deleteRule('api', opts)).archived);
});
test('wiki CRUD synchronizes scope routing and release metadata', async (t) => {
  const f = await fixture(t), opts = { ...f.options, maintenance: true, by: 'owner' };
  await api.newWiki('api', opts);
  const candidate = frontmatter(await api.showWiki('api', opts));
  candidate.metadata.version = '1.0.0'; candidate.metadata.status = 'active'; candidate.metadata.scope = ['src/api/**'];
  const from = path.join(f.directory, 'wiki.md');
  await fs.writeFile(from, markdown(candidate.metadata, '# API knowledge\nSource: src/api.'));
  await rejects(api.updateWiki('api', { ...opts, from }), 'UNVERIFIED_WIKI');
  candidate.metadata.released_at = '2026-10-05'; candidate.metadata.verified_against = 'abc1234';
  await fs.writeFile(from, markdown(candidate.metadata, '# API knowledge\nSource: src/api.'));
  await api.updateWiki('api', { ...opts, from });
  assert.equal((await api.resolveQuery('wiki', 'src/api/handler.mjs', f.options))[0].context, 'api');
  await api.deleteWiki('api', opts);
  assert.equal((await api.wikiInventory(f.workspace)).length, 0);
});
test('managed paths and wiki map cannot traverse outside their root', async (t) => {
  const f = await fixture(t);
  await rejects(safePath(f.options.repo, '../external.txt'), 'UNSAFE_PATH');
  await f.write('wiki/MAP.yaml', stringify({ version: 1, contexts: { bad: { file: '../../outside.md', description: 'bad' } } }));
  await rejects(api.wikiInventory(f.workspace), 'UNSAFE_PATH');
});
test('git fingerprint covers staged/untracked source and ignores task artifacts', async (t) => {
  const f = await fixture(t);
  assert.equal((await capture('git', ['init'], f.options.repo)).code, 0);
  await f.write('src/value.mjs', 'baseline');
  await capture('git', ['add', 'src/value.mjs'], f.options.repo);
  const before = await sourceSnapshot(f.workspace);
  await f.write('src/value.mjs', 'staged');
  await capture('git', ['add', 'src/value.mjs'], f.options.repo);
  await f.write('src/untracked.mjs', 'new');
  await f.write('.agent/evidence/log.txt', 'ignored');
  const after = await sourceSnapshot(f.workspace);
  assert.notEqual(before.digest, after.digest);
  assert.ok(after.files['src/untracked.mjs']);
  assert.equal(after.files['.agent/evidence/log.txt'], undefined);
});
test('fake harness receives stdin; exit zero does not mark task done', async (t) => {
  const f = await fixture(t);
  const script = await f.write('fake.mjs', "import fs from 'node:fs'; let input=''; for await (const chunk of process.stdin) input+=chunk; fs.writeFileSync('.agent/evidence/received.txt', input);");
  await fs.mkdir(path.join(f.options.repo, '.agent/evidence'), { recursive: true });
  const config = await readYaml(path.join(f.options.repo, '.agent/workspace.yaml'));
  config.adapters = { fake: { command: process.execPath, args: [script] } };
  await f.write('.agent/workspace.yaml', stringify(config));
  const id = await approved(f);
  assert.equal((await api.runTask(id, { ...f.options, with: 'fake' })).status, 'awaiting-evidence');
  assert.equal((await api.listTasks(f.options))[0].status, 'approved');
  assert.ok((await fs.readFile(path.join(f.options.repo, '.agent/evidence/received.txt'), 'utf8')).includes('Employee Brief'));
  assert.equal(await exists(path.join(f.options.repo, '.agent/execution.lock')), false);
});
test('failed harness mutations are checked and execution lock cleaned', async (t) => {
  const f = await fixture(t);
  const script = await f.write('fake.mjs', "import fs from 'node:fs'; for await (const chunk of process.stdin) {} fs.appendFileSync('.agent/CORE.md','weakened'); process.exitCode=7;");
  const config = await readYaml(path.join(f.options.repo, '.agent/workspace.yaml'));
  config.adapters = { fake: { command: process.execPath, args: [script] } };
  await f.write('.agent/workspace.yaml', stringify(config));
  const id = await approved(f);
  await rejects(api.runTask(id, { ...f.options, with: 'fake' }), 'GOVERNANCE_CHANGED');
  assert.equal(await exists(path.join(f.options.repo, '.agent/execution.lock')), false);
});
test('execution lock prevents maintenance/approval', async (t) => {
  const f = await fixture(t), id = await approved(f);
  await f.write('.agent/execution.lock', '{}');
  await rejects(api.newRule('locked', { ...f.options, maintenance: true, by: 'owner' }), 'EXECUTION_ACTIVE');
  await rejects(api.approveTask(id, { ...f.options, by: 'owner' }), 'EXECUTION_ACTIVE');
});
test('CLI rejects unrelated flags with deterministic JSON error', async (t) => {
  const f = await fixture(t), cli = path.join(root, 'bin/agent-workspace.js');
  const result = await capture(process.execPath, [cli, 'task', 'list', '--from', 'bad', '--json', '--repo', f.options.repo], root);
  assert.equal(result.code, 1);
  assert.equal(JSON.parse(result.stderr).error, 'INVALID_OPTION');
  const list = await capture(process.execPath, [cli, 'task', 'list', '--json', '--repo', f.options.repo], root);
  assert.equal(list.code, 0);
  assert.deepEqual(JSON.parse(list.stdout), []);
});
test('PowerShell UTF-8 BOM receipts remain readable', async (t) => {
  const f = await fixture(t), id = await approved(f);
  await api.prepare(id, f.options);
  const { receiptPath, receipt } = await passingReceipt(f, id);
  await fs.writeFile(receiptPath, '\uFEFF' + JSON.stringify(receipt));
  assert.equal((await api.validateEvidence(id, f.options)).valid, true);
});
test('environment home overrides a checkout-specific home', async (t) => {
  const f = await fixture(t);
  const alternative = path.join(f.directory, 'alternate-home');
  await api.initGlobal({ home: alternative });
  const previous = process.env.AGENT_WORKSPACE_HOME;
  process.env.AGENT_WORKSPACE_HOME = alternative;
  try {
    const workspace = await api.loadWorkspace({ repo: f.options.repo });
    assert.equal(workspace.home, alternative);
    assert.equal(workspace.globalCore, path.join(alternative, 'core/CORE.md'));
  } finally {
    if (previous === undefined) delete process.env.AGENT_WORKSPACE_HOME;
    else process.env.AGENT_WORKSPACE_HOME = previous;
  }
});
test('mandatory specialist evidence cannot be omitted from a task receipt', async (t) => {
  const f = await fixture(t), id = await approved(f);
  await f.write('.agent/rules/value.md', markdown({ id: 'value-policy', level: 'specialist', status: 'active', paths: ['src/**'], required_evidence: ['E2'] }, '# Inspect literal configuration.'));
  await api.prepare(id, f.options);
  await passingReceipt(f, id);
  await rejects(api.validateEvidence(id, f.options), 'EVIDENCE_GATE_FAILED');
});
test('managed directories reject links to outside locations', async (t) => {
  const f = await fixture(t);
  const external = path.join(f.directory, 'external');
  await fs.mkdir(external);
  await fs.symlink(external, path.join(f.options.repo, '.agent', 'linked'), process.platform === 'win32' ? 'junction' : 'dir');
  await rejects(safePath(f.options.repo, '.agent/linked/output.txt'), 'UNSAFE_PATH');
});
test('planning draft can refresh context after authorized knowledge maintenance', async (t) => {
  const f = await fixture(t);
  await api.newTask('PLANNING', f.options);
  await api.prepare('PLANNING', { ...f.options, draft: true });
  await api.newRule('new-policy', { ...f.options, maintenance: true, by: 'owner' });
  assert.equal((await api.prepare('PLANNING', { ...f.options, draft: true })).manifest.task.status, 'draft');
});
test('mandatory rule semantic evidence also requires a semantic capability before execution', async (t) => {
  const f = await fixture(t), id = await approved(f);
  await f.write('.agent/rules/value.md', markdown({ id: 'semantic-policy', level: 'specialist', status: 'active', paths: ['src/**'], required_evidence: ['E1'] }, '# Semantic caller inspection required.'));
  const plan = await api.runTask(id, { ...f.options, dryRun: true });
  assert.ok(plan.blockers.some((item) => item.includes('semantic')));
});

test('portable routers pin the npm identity and refresh preserves surrounding instructions', async (t) => {
  const f = await fixture(t);
  const identity = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
  const router = await fs.readFile(path.join(f.options.repo, 'AGENTS.md'), 'utf8');
  assert.ok(router.includes(identity.name + '@' + identity.version));
  assert.ok(!router.includes(root.replaceAll('\\', '/')));
  const old = 'Before: preserve this instruction.\n<!-- agent-workspace:start -->\nnode "C:/old-machine/cli.js"\n<!-- agent-workspace:end -->\nAfter: preserve this instruction.\n';
  await f.write('AGENTS.md', old);
  await api.installAdapter(f.options.repo, 'codex');
  assert.equal(await fs.readFile(path.join(f.options.repo, 'AGENTS.md'), 'utf8'), old);
  await api.installAdapter(f.options.repo, 'codex', { refresh: true });
  const updated = await fs.readFile(path.join(f.options.repo, 'AGENTS.md'), 'utf8');
  assert.ok(updated.startsWith('Before: preserve this instruction.\n'));
  assert.ok(updated.endsWith('\nAfter: preserve this instruction.\n'));
  assert.ok(updated.includes(identity.name + '@' + identity.version));
  assert.ok(!updated.includes('old-machine'));
  await f.write('.agent/execution.lock', '{"pid":123}');
  await rejects(api.installAdapter(f.options.repo, 'codex', { refresh: true }), 'EXECUTION_ACTIVE');
});

test('GitHub distribution uses the public versioned release and rejects malformed refresh', async (t) => {
  const f = await fixture(t);
  const identity = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
  const options = { ...f.options, repo: path.join(f.directory, 'github-project'), distribution: 'github' };
  await api.bootstrap(options);
  const router = await fs.readFile(path.join(options.repo, 'AGENTS.md'), 'utf8');
  assert.ok(router.includes('/releases/download/v' + identity.version + '/' + identity.name + '-' + identity.version + '.tgz'));
  await f.write('AGENTS.md', 'User text.\n<!-- agent-workspace:start -->\nIncomplete router.');
  await rejects(api.installAdapter(f.options.repo, 'codex', { refresh: true }), 'INVALID_ADAPTER');
  assert.ok((await fs.readFile(path.join(f.options.repo, 'AGENTS.md'), 'utf8')).endsWith('Incomplete router.'));
});

test('CLI setup initializes shared context; init initializes the project and harness', async (t) => {
  const f = await fixture(t), cli = path.join(root, 'bin/agent-workspace.js');
  const repo = path.join(f.directory, 'new-project'), home = path.join(f.directory, 'new-home');
  const setup = await capture(process.execPath, [cli, 'setup', '--home', home, '--repo', repo, '--json'], root);
  assert.equal(setup.code, 0, setup.stderr);
  assert.ok(await exists(path.join(home, 'core/CORE.md')));
  assert.ok(!await exists(path.join(repo, '.agent')));
  const init = await capture(process.execPath, [cli, 'init', '--repo', repo, '--home', home, '--with', 'gemini', '--json'], root);
  assert.equal(init.code, 0, init.stderr);
  assert.ok(await exists(path.join(repo, 'GEMINI.md')));
  assert.ok(await exists(path.join(repo, '.agent/workspace.yaml')));
});

test('source fingerprint covers a workspace ignored by a parent Git repository', async (t) => {
  const f = await fixture(t);
  assert.equal((await capture('git', ['init'], f.directory)).code, 0);
  await fs.writeFile(path.join(f.directory, '.gitignore'), 'repo/\nhome/\n');
  await f.write('src/value.mjs', 'export const value = 1;\n');
  const before = await sourceSnapshot(f.workspace);
  assert.ok(before.files['src/value.mjs']);
  await f.write('src/value.mjs', 'export const value = 2;\n');
  assert.notEqual((await sourceSnapshot(f.workspace)).digest, before.digest);
});

test('default init routes four platforms to one skills folder and a separate wiki', async (t) => {
  const f = await fixture(t);
  for (const file of ['AGENTS.md', 'CLAUDE.md', 'GEMINI.md', '.agent/ADAPTER.md', '.agent/rules/agent-workspace.md']) {
    const content = await fs.readFile(path.join(f.options.repo, file), 'utf8');
    assert.ok(content.includes('.agent/skills'), file);
    assert.ok(content.includes('plan:'), file);
    assert.ok(!content.includes('{{SKILLS}}'), file);
  }
  for (const folder of ['.agents', '.claude', '.gemini', '.codex', '.agent/wiki']) assert.ok(!await exists(path.join(f.options.repo, folder)), folder);
  const skills = ['analyze', 'interview', 'pipeline', 'plan', 'review', 'tdd', 'wiki-maintenance'];
  assert.deepEqual((await fs.readdir(path.join(f.options.repo, '.agent/skills'))).sort(), skills);
  for (const name of skills) {
    const skill = frontmatter(await fs.readFile(path.join(f.options.repo, '.agent/skills', name, 'SKILL.md'), 'utf8'));
    assert.equal(skill.metadata.name, name);
    assert.ok(skill.metadata.description.trim());
    assert.ok(skill.body.trim());
  }
  assert.ok(await exists(path.join(f.options.repo, 'wiki/INDEX.md')));
  assert.ok(await exists(path.join(f.options.repo, 'wiki/MAP.yaml')));
  const rule = frontmatter(await fs.readFile(path.join(f.options.repo, '.agent/rules/agent-workspace.md'), 'utf8'));
  assert.equal(rule.metadata.trigger, 'always_on');
  const repeated = await api.bootstrap(f.options);
  assert.deepEqual(repeated.repo.platforms, ['codex', 'claude', 'gemini', 'antigravity']);
  assert.equal(repeated.repo.skills.directory, '.agent/skills');
  assert.equal(repeated.repo.skills.created, 0);
  assert.equal(repeated.repo.skills.preserved, 7);
  assert.equal((await api.skillInventory(f.workspace)).length, 7);
});

test('selected platforms install additively and reuse customized shared workflows', async (t) => {
  const f = await fixture(t);
  const options = { ...f.options, repo: path.join(f.directory, 'selected-project'), with: 'codex,claude,codex' };
  const first = await api.bootstrap(options);
  assert.deepEqual(first.repo.platforms, ['codex', 'claude']);
  assert.equal(first.repo.skills.created, 7);
  assert.ok(!await exists(path.join(options.repo, 'GEMINI.md')));
  assert.ok(!await exists(path.join(options.repo, '.agent/rules/agent-workspace.md')));
  const claude = path.join(options.repo, 'CLAUDE.md');
  await fs.writeFile(claude, 'Custom Claude instruction.\n');
  const local = path.join(options.repo, '.agent/skills/plan/SKILL.md');
  const customized = markdown({ name: 'plan', description: 'Custom project plan.' }, '# Keep the project planning convention.');
  await fs.writeFile(local, customized);
  const extra = await api.bootstrap({ ...options, with: ['claude', 'gemini'] });
  assert.deepEqual(extra.repo.platforms, ['claude', 'gemini']);
  assert.equal(extra.repo.skills.created, 0);
  assert.equal(extra.repo.skills.preserved, 7);
  assert.ok((await fs.readFile(claude, 'utf8')).startsWith('Custom Claude instruction.\n'));
  assert.equal(await fs.readFile(local, 'utf8'), customized);
  assert.ok(await exists(path.join(options.repo, 'AGENTS.md')));
  assert.ok(await exists(path.join(options.repo, 'GEMINI.md')));
  assert.equal((await api.skillInventory(await api.loadWorkspace(options))).find((skill) => skill.id === 'plan').text, customized);
  const rule = path.join(options.repo, '.agent/rules/agent-workspace.md');
  await fs.writeFile(rule, 'Custom Antigravity instruction.\n');
  await api.installAdapters(options.repo, 'antigravity');
  const merged = frontmatter(await fs.readFile(rule, 'utf8'));
  assert.equal(merged.metadata.trigger, 'always_on');
  assert.ok(merged.body.includes('Custom Antigravity instruction.\n'));
});

test('invalid platform selections and active executions fail before initialization writes', async (t) => {
  const f = await fixture(t);
  for (const value of ['codex,unknown', 'codex,', '', []]) {
    const options = { repo: path.join(f.directory, 'invalid-project'), home: path.join(f.directory, 'invalid-home'), with: value };
    await rejects(api.bootstrap(options), 'UNKNOWN_HARNESS');
    assert.ok(!await exists(options.repo));
    assert.ok(!await exists(options.home));
  }
  await f.write('.agent/execution.lock', '{"pid":123}');
  const home = path.join(f.directory, 'blocked-home');
  await rejects(api.bootstrap({ ...f.options, home, with: 'all' }), 'EXECUTION_ACTIVE');
  assert.ok(!await exists(home));
});

test('shared skills and adapter rule mutations invalidate prepared governance', async (t) => {
  const f = await fixture(t), id = await approved(f);
  await api.prepare(id, f.options);
  const before = await governanceSnapshot(f.workspace);
  const relative = '.agent/skills/tdd/SKILL.md';
  assert.ok(before.files[path.join(f.options.repo, relative)]);
  assert.ok(before.files[path.join(f.options.repo, '.agent/rules/agent-workspace.md')]);
  await fs.appendFile(path.join(f.options.repo, relative), '\nUnexpected workflow mutation.\n');
  await rejects(api.prepare(id, f.options), 'GOVERNANCE_CHANGED');
});

test('CLI accepts CSV and repeated init platforms, refreshes only managed blocks, and runs one harness', async (t) => {
  const f = await fixture(t), cli = path.join(root, 'bin/agent-workspace.js');
  const repo = path.join(f.directory, 'cli-multi');
  const args = ['--repo', repo, '--home', f.options.home, '--json'];
  const init = await capture(process.execPath, [cli, 'init', '--with', 'codex,claude', '--with', 'gemini', ...args], root);
  assert.equal(init.code, 0, init.stderr);
  assert.deepEqual(JSON.parse(init.stdout).repo.platforms, ['codex', 'claude', 'gemini']);
  const old = 'Before.\n<!-- agent-workspace:start -->\nOld router.\n<!-- agent-workspace:end -->\nAfter.\n';
  for (const file of ['AGENTS.md', 'CLAUDE.md']) await fs.writeFile(path.join(repo, file), old);
  const refreshed = await capture(process.execPath, [cli, 'init', '--with', 'codex,claude', '--refresh', ...args], root);
  assert.equal(refreshed.code, 0, refreshed.stderr);
  for (const file of ['AGENTS.md', 'CLAUDE.md']) {
    const content = await fs.readFile(path.join(repo, file), 'utf8');
    assert.ok(content.startsWith('Before.\n'));
    assert.ok(content.endsWith('\nAfter.\n'));
    assert.ok(!content.includes('Old router.'));
  }
  const extra = await capture(process.execPath, [cli, 'adapter', 'install', '--with', 'all', ...args], root);
  assert.equal(extra.code, 0, extra.stderr);
  assert.equal(JSON.parse(extra.stdout).platforms.length, 4);
  await approved(f, 'CLI-RUN');
  const single = await capture(process.execPath, [cli, 'run', 'CLI-RUN', '--with', 'codex', '--dry-run', '--repo', f.options.repo, '--home', f.options.home, '--json'], root);
  assert.equal(single.code, 0, single.stderr);
  const multiple = await capture(process.execPath, [cli, 'run', 'NEW', '--with', 'codex,claude', '--dry-run', ...args], root);
  assert.equal(JSON.parse(multiple.stderr).error, 'INVALID_OPTION');
});

test('custom hidden wiki location supports CRUD and preserves preexisting documentation', async (t) => {
  const f = await fixture(t);
  const options = { ...f.options, repo: path.join(f.directory, 'hidden-wiki'), wikiDir: '.wiki', with: 'claude' };
  await fs.mkdir(path.join(options.repo, '.wiki'), { recursive: true });
  await fs.writeFile(path.join(options.repo, '.wiki/INDEX.md'), '# Existing team wiki\n');
  await api.bootstrap(options);
  const workspace = await api.loadWorkspace(options);
  assert.equal(workspace.config.wiki.map, '.wiki/MAP.yaml');
  assert.equal(await fs.readFile(workspace.wikiIndex, 'utf8'), '# Existing team wiki\n');
  assert.ok(!await exists(path.join(options.repo, 'wiki')));
  const authority = { ...options, maintenance: true, by: 'authorized-agent' };
  await api.newWiki('auth', authority);
  assert.ok(await exists(path.join(options.repo, '.wiki/contexts/auth.md')));
  const page = frontmatter(await api.showWiki('auth', options));
  page.metadata.version = '1.0.0';
  page.metadata.status = 'active';
  page.metadata.released_at = '2026-10-05';
  page.metadata.verified_against = 'source-revision-inspected';
  page.metadata.scope = ['src/auth/**'];
  page.body = '# Authentication\n\nVerified flow and source entrypoints.';
  const candidate = path.join(f.directory, 'auth-page.md');
  await fs.writeFile(candidate, markdown(page.metadata, page.body));
  await api.updateWiki('auth', { ...authority, from: candidate, tags: ['auth'] });
  assert.equal((await api.resolveQuery('wiki', 'auth', options))[0].context, 'auth');
  assert.equal((await api.doctor(options)).ok, true);
  await api.deleteWiki('auth', authority);
  assert.ok(!await exists(path.join(options.repo, '.wiki/contexts/auth.md')));
});

test('reinitializing a legacy wiki preserves its configured path and custom pages', async (t) => {
  const f = await fixture(t);
  const options = { ...f.options, repo: path.join(f.directory, 'legacy-wiki'), wikiDir: '.agent/wiki' };
  await api.bootstrap(options);
  const index = path.join(options.repo, '.agent/wiki/INDEX.md');
  await fs.writeFile(index, '# Maintained legacy index\n');
  const repeated = await api.bootstrap({ ...options, wikiDir: 'wiki', refresh: true });
  assert.equal(repeated.repo.wiki.index, '.agent/wiki/INDEX.md');
  assert.equal(await fs.readFile(index, 'utf8'), '# Maintained legacy index\n');
  assert.ok(!await exists(path.join(options.repo, 'wiki')));
  assert.equal((await api.doctor(options)).ok, true);
});

test('wiki traversal is rejected before global setup and CLI honors --wiki-dir', async (t) => {
  const f = await fixture(t);
  const options = { repo: path.join(f.directory, 'unsafe-wiki'), home: path.join(f.directory, 'unused-home'), wikiDir: '../outside' };
  await rejects(api.bootstrap(options), 'UNSAFE_PATH');
  assert.ok(!await exists(options.home));
  assert.ok(!await exists(options.repo));
  const cli = path.join(root, 'bin/agent-workspace.js');
  const repo = path.join(f.directory, 'cli-wiki');
  const init = await capture(process.execPath, [cli, 'init', '--repo', repo, '--home', f.options.home, '--with', 'claude,gemini', '--wiki-dir', '.wiki', '--json'], root);
  assert.equal(init.code, 0, init.stderr);
  assert.equal(JSON.parse(init.stdout).repo.wiki.map, '.wiki/MAP.yaml');
});
