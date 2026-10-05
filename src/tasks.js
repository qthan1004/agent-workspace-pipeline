import fs from 'node:fs/promises';
import path from 'node:path';
import { exists, fail, frontmatter, hash, markdown, packageRoot, requireId, safePath, validateSchema, writeManaged, writeNew } from './io.js';
import { loadWorkspace } from './workspace.js';

export const sections = ['Goal', 'User Intent', 'Decisions', 'Constraints', 'Non-goals', 'Acceptance Criteria', 'Known Impact Surface', 'Relevant Project Context', 'Expected Write Scope', 'Required Evidence', 'Definition of Done', 'Escalation Conditions'];
export function contractHash(task) {
  const { status, approval, ...semantics } = task.metadata;
  function canonical(value) {
    if (Array.isArray(value)) return value.map(canonical);
    if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
    return value;
  }
  return hash(JSON.stringify(canonical(semantics)) + '\n' + task.body.trim());
}
export async function newTask(id, options = {}) {
  requireId(id);
  const workspace = await loadWorkspace(options);
  const template = (await fs.readFile(path.join(packageRoot, 'templates/task.md'), 'utf8')).replaceAll('{{ID}}', id);
  const result = await writeNew(workspace.repo, '.agent/tasks/' + id + '.md', template);
  if (!result.created) fail('ALREADY_EXISTS', 'Task already exists: ' + result.file);
  return result;
}
export async function readTask(workspace, id) {
  requireId(id);
  const file = await safePath(workspace.repo, '.agent/tasks/' + id + '.md');
  if (!(await exists(file))) fail('TASK_NOT_FOUND', 'Task does not exist: ' + id);
  const task = { ...frontmatter(await fs.readFile(file, 'utf8'), file), file };
  await validateSchema('task', task.metadata);
  if (task.metadata.id !== id) fail('TASK_ID_MISMATCH', 'Filename and task ID differ.');
  return task;
}
export function validateTaskContent(task, { draft = false } = {}) {
  const errors = [];
  for (const value of [...task.metadata.paths, ...task.metadata.expected_write_scope]) {
    if (/^(?:[A-Za-z]:|\/|\\)|(?:^|[\/\\])\.\.(?:[\/\\]|$)/.test(value)) errors.push('Task paths/scopes must stay repo-relative: ' + value);
  }
  if (task.metadata.paths.some((file) => /\.[cm]?tsx?$/i.test(file)) && task.metadata.symbols.length && !task.metadata.required_evidence.includes('E1')) errors.push('Typed symbol tasks require E1 semantic evidence.');
  for (const section of sections) {
    const heading = '# ' + section + '\n';
    const start = task.body.indexOf(heading);
    if (start < 0) { errors.push('Missing section: ' + section); continue; }
    const tail = task.body.slice(start + heading.length);
    const end = tail.search(/^# /m);
    if (!(end < 0 ? tail : tail.slice(0, end)).trim()) errors.push('Empty section: ' + section);
  }
  if (!draft && /\b(TODO|TBD|FIXME)\b|\{\{[^}]+\}\}/i.test(task.body + JSON.stringify(task.metadata))) errors.push('Replace all scaffold placeholders before approval.');
  for (const key of ['acceptance_criteria', 'dod']) {
    const ids = task.metadata[key].map((item) => item.id);
    if (new Set(ids).size !== ids.length) errors.push('Duplicate IDs in ' + key);
  }
  const acceptance = new Set(task.metadata.acceptance_criteria.map((item) => item.id));
  const covered = new Set();
  for (const criterion of task.metadata.dod) {
    for (const id of criterion.acceptance) {
      if (!acceptance.has(id)) errors.push('Unknown acceptance criterion in DoD: ' + id);
      covered.add(id);
    }
  }
  for (const id of acceptance) if (!covered.has(id)) errors.push('Acceptance criterion has no evidence-backed DoD: ' + id);
  if (errors.length) fail('INVALID_CONTRACT', 'Task Contract is incomplete', errors);
}
export function requireApproved(task, { allowDone = false } = {}) {
  validateTaskContent(task);
  if (task.metadata.status !== 'approved' && !(allowDone && task.metadata.status === 'done')) fail('TASK_NOT_APPROVED', 'Execution requires an approved contract. Run task approve <id> --by <approver> after review.');
  if (!task.metadata.approval || task.metadata.approval.contract_sha256 !== contractHash(task)) fail('APPROVAL_STALE', 'Contract changed after approval. Review it and approve its current version.');
}
export async function validateTask(id, options = {}) {
  const workspace = await loadWorkspace(options);
  const task = await readTask(workspace, id);
  validateTaskContent(task, { draft: options.draft });
  if (!options.draft) requireApproved(task, { allowDone: true });
  return { valid: true, id, status: task.metadata.status, contract_sha256: contractHash(task) };
}
export async function approveTask(id, options = {}) {
  if (!options.by?.trim()) fail('MISSING_APPROVER', 'Pass --by <human-or-strong-layer> to record the semantic authority.');
  const workspace = await loadWorkspace(options);
  const { assertIdle } = await import('./maintenance.js');
  await assertIdle(workspace);
  const task = await readTask(workspace, id);
  if (task.metadata.status === 'done') fail('TASK_ALREADY_DONE', 'Create a new task or explicitly revise this contract before re-approval.');
  validateTaskContent(task);
  task.metadata.status = 'approved';
  task.metadata.approval = { by: options.by, at: new Date().toISOString(), contract_sha256: contractHash(task) };
  await writeManaged(workspace.repo, '.agent/tasks/' + id + '.md', markdown(task.metadata, task.body));
  return { id, approval: task.metadata.approval };
}
