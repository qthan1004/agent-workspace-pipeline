import fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { stringify } from 'yaml';
import { fail, hash, safePath, writeNew } from './io.js';
import { loadWorkspace } from './workspace.js';
import { contractHash, readTask } from './tasks.js';

const categories = ['skill', 'wiki', 'task-compiler', 'tool-routing', 'executor-capability'];
export async function collectLearning(options = {}) {
  if (!options.task || !options.evidence?.length || !options.reason) fail('INCOMPLETE_LEARNING', 'Use --task <id> --reason <observed-pattern> --evidence <artifact> (repeatable).');
  const workspace = await loadWorkspace(options), task = await readTask(workspace, options.task), artifacts = [];
  for (const relative of options.evidence) artifacts.push({ artifact: relative, sha256: hash(await fs.readFile(await safePath(workspace.repo, relative))) });
  const record = { version: 1, task_id: options.task, contract_sha256: contractHash(task), observation: options.reason, artifacts, recorded_at: new Date().toISOString() };
  return { ...await writeNew(workspace.repo, '.agent/learning/' + randomUUID() + '.json', JSON.stringify(record, null, 2) + '\n'), record };
}
export async function proposeLearning(options = {}) {
  if (!categories.includes(options.category) || !options.reason || !options.proposedChange || !options.evidence?.length) fail('INCOMPLETE_LEARNING', 'Use --category skill|wiki|task-compiler|tool-routing|executor-capability --reason --proposed-change --evidence <collected-record> (repeatable).');
  const workspace = await loadWorkspace(options), evidence = [];
  for (const relative of options.evidence) evidence.push({ artifact: relative, sha256: hash(await fs.readFile(await safePath(workspace.repo, relative))) });
  const proposal = { version: 1, status: 'proposed', category: options.category, recurring_pattern: options.reason, evidence, proposed_change: options.proposedChange };
  return { ...await writeNew(workspace.repo, '.agent/change-requests/learning-' + randomUUID() + '.yaml', stringify(proposal)), proposal };
}
