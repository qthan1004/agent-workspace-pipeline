import fs from 'node:fs/promises';
import { fail, safePath, writeNew } from './io.js';
import { loadWorkspace } from './workspace.js';
import { contractHash, readTask, requireApproved } from './tasks.js';
import { prepare } from './prepare.js';
import { assertGovernance } from './snapshot.js';
import { launch } from './process.js';

export const nativeCommands = {
  codex: { command: 'codex', args: ['exec', '--sandbox', 'workspace-write', '-'] },
  claude: { command: 'claude', args: ['-p', 'Execute the approved Employee Brief provided on stdin; follow its evidence and escalation gates.'] },
  gemini: { command: 'gemini', args: ['--prompt', 'Execute the approved Employee Brief provided on stdin; follow its evidence and escalation gates.'] }
};
export async function runTask(id, options = {}) {
  const workspace = await loadWorkspace(options);
  const harness = options.with || 'codex';
  const adapter = Object.hasOwn(workspace.config.adapters || {}, harness) ? workspace.config.adapters[harness] : Object.hasOwn(nativeCommands, harness) ? nativeCommands[harness] : undefined;
  if (!adapter) fail('NO_EXECUTABLE_ADAPTER', 'Use prepare --format ' + harness + ' with the IDE, or configure adapters.' + harness + ' with command/args in workspace.yaml.');
  const prepared = await prepare(id, { ...options, format: harness, draft: false });
  const missing = prepared.manifest.capabilities.filter((item) => !item.configured);
  const plan = { harness, command: adapter.command, args: adapter.args, cwd: workspace.repo, prompt_file: prepared.promptFile, required_capabilities: prepared.manifest.capabilities, blockers: missing.map((item) => 'Configure and connect ' + item.name), model_targets: prepared.manifest.execution.model_targets, minimum_effort: 'high' };
  if (options.dryRun) return plan;
  if (missing.length) fail('MISSING_CAPABILITY', 'Required capabilities are not configured in this repo/harness.', plan.blockers);
  const lock = await writeNew(workspace.repo, '.agent/execution.lock', JSON.stringify({ task: id, pid: process.pid, started_at: new Date().toISOString() }));
  if (!lock.created) fail('EXECUTION_ACTIVE', 'A task execution is already active in this repo.');
  try {
    let result, executionError;
    try { result = await launch(adapter.command, adapter.args, workspace.repo, prepared.prompt); }
    catch (error) { executionError = error; }
    // Check protected invariants even when the child fails.
    await assertGovernance(workspace, prepared.manifest.governance);
    const currentTask = await readTask(workspace, id);
    requireApproved(currentTask);
    if (contractHash(currentTask) !== prepared.manifest.task.contract_sha256) fail('SEMANTICS_CHANGED', 'Task semantics changed during execution.');
    if (executionError) fail('HARNESS_UNAVAILABLE', 'Cannot start harness: ' + adapter.command, [executionError.message]);
    if (result.code !== 0) fail('HARNESS_FAILED', 'Harness exited without success.', ['exit_code=' + result.code, 'signal=' + result.signal]);
    return { ...plan, exit_code: 0, status: 'awaiting-evidence', next: 'evidence validate ' + id + '; task finish ' + id };
  } finally { await fs.unlink(await safePath(workspace.repo, '.agent/execution.lock')); }
}
