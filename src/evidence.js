import fs from 'node:fs/promises';
import { fail, hash, readJson, requireId, safePath, validateSchema, writeManaged, writeNew } from './io.js';
import { loadWorkspace } from './workspace.js';
import { contractHash, readTask, requireApproved } from './tasks.js';
import { readPrepared } from './prepare.js';
import { assertGovernance, changedFiles, sourceSnapshot } from './snapshot.js';
import { matchesPath } from './resolver.js';
import { reviewReceiptHash, validateImpact } from './impact.js';

export async function evidenceState(id, options = {}) {
  requireId(id);
  const workspace = await loadWorkspace(options);
  const task = await readTask(workspace, id);
  requireApproved(task, { allowDone: true });
  const baseline = await readPrepared(workspace, id);
  if (baseline.task.contract_sha256 !== contractHash(task)) fail('BASELINE_STALE', 'Contract changed since prepare; prepare the approved revision.');
  await assertGovernance(workspace, baseline.governance);
  const source = await sourceSnapshot(workspace);
  return { workspace, task, baseline, source };
}
const receiptName = (id, options) => options.file || '.agent/evidence/' + id + '.json';
export async function evidenceInit(id, options = {}) {
  const state = await evidenceState(id, options);
  const receipt = {
    task_id: id, task_version: state.task.metadata.version, contract_sha256: contractHash(state.task), source_digest: state.source.digest,
    implementation_complete: false, unresolved_semantics: [], scope_expansions: [], decisions: [], evidence: [],
    dod: state.task.metadata.dod.map((criterion) => ({ id: criterion.id, evidence: [] }))
  };
  const result = await writeNew(state.workspace.repo, receiptName(id, options), JSON.stringify(receipt, null, 2) + '\n');
  if (!result.created) fail('ALREADY_EXISTS', 'Receipt exists. Use --file for a new receipt after source changes: ' + result.file);
  return { ...result, receipt };
}
export async function readReceipt(workspace, id, options) {
  const file = await safePath(workspace.repo, receiptName(id, options));
  return { file, receipt: await readJson(file) };
}
export async function evidenceSnapshot(id, options = {}) {
  const { task, source } = await evidenceState(id, options);
  return { task_id: id, task_version: task.metadata.version, contract_sha256: contractHash(task), source_digest: source.digest };
}
export async function evidenceChanges(id, options = {}) {
  const state = await evidenceState(id, options);
  const changed = changedFiles(state.baseline.source.files, state.source.files);
  const artifact = {
    task_id: id, contract_sha256: contractHash(state.task), source_digest: state.source.digest,
    baseline_digest: state.baseline.source.digest,
    changed_files: changed,
    changes: changed.map((file) => ({ file, before: state.baseline.source.files[file] || null, after: state.source.files[file] || null }))
  };
  const relative = '.agent/evidence/' + id + '/changes-' + state.source.digest.slice(0, 12) + '.json';
  const file = await writeManaged(state.workspace.repo, relative, JSON.stringify(artifact, null, 2) + '\n');
  return { file, artifact: relative, sha256: hash(await fs.readFile(file)), changed_files: changed };
}
export async function evidenceRecord(id, options = {}) {
  if (!['E1', 'E2', 'E3', 'E4', 'E5'].includes(options.kind) || !options.artifact || !options.description) fail('INVALID_EVIDENCE_INPUT', 'Provide --kind E1..E5 --artifact <repo-relative-file> --description <observed-result>.');
  if (options.result !== 'passed') fail('RESULT_REQUIRED', 'Pass --result passed only for verification that actually passed; failed/skipped evidence cannot satisfy DONE.');
  const state = await evidenceState(id, options);
  const { receipt } = await readReceipt(state.workspace, id, options);
  if (receipt.source_digest !== state.source.digest || receipt.contract_sha256 !== contractHash(state.task)) fail('EVIDENCE_STALE', 'Source/contract changed since receipt creation. Create a fresh receipt and rerun verification.');
  const file = await safePath(state.workspace.repo, options.artifact);
  const entry = { id: options.entry || options.kind + '-' + (receipt.evidence.length + 1), kind: options.kind, description: options.description, artifact: options.artifact, sha256: hash(await fs.readFile(file)), result: 'passed' };
  if (options.provider) entry.provider = options.provider;
  if (options.symbol) entry.symbol = options.symbol;
  if (options.fallbackReason) entry.fallback_reason = options.fallbackReason;
  for (const [option, field] of [['references', 'references'], ['inspected', 'inspected']]) if (options[option] !== undefined) {
    const count = Number(options[option]);
    if (!Number.isInteger(count) || count < 0) fail('INVALID_COUNT', field + ' must be a nonnegative integer.');
    entry[field] = count;
  }
  if (options.kind === 'E1' && !entry.provider) fail('MISSING_SEMANTIC_PROVIDER', 'E1 needs the actual --provider; text search is not semantic evidence.');
  if (receipt.evidence.some((item) => item.id === entry.id)) fail('DUPLICATE_EVIDENCE', 'Evidence ID already exists: ' + entry.id);
  receipt.evidence.push(entry);
  await writeManaged(state.workspace.repo, receiptName(id, options), JSON.stringify(receipt, null, 2) + '\n');
  return entry;
}
export async function evidenceImpact(id, options = {}) {
  const state = await evidenceState(id, options);
  const { receipt } = await readReceipt(state.workspace, id, options);
  if (options.artifact) {
    const bytes = await fs.readFile(await safePath(state.workspace.repo, options.artifact));
    const pointer = { artifact: options.artifact, sha256: hash(bytes) };
    const report = await validateImpact(state, receipt, pointer);
    receipt.impact = pointer;
    await writeManaged(state.workspace.repo, receiptName(id, options), JSON.stringify(receipt, null, 2) + '\n');
    return { ...pointer, report };
  }
  const changed = changedFiles(state.baseline.source.files, state.source.files);
  const report = { version: 1, status: 'pending', task_id: id, contract_sha256: contractHash(state.task), source_digest: state.source.digest, baseline_digest: state.baseline.source.digest, changed_files: changed, wider_dependencies: '', no_changes_reason: '', unresolved: [], conclusions: [], lookups: [] };
  const artifact = '.agent/evidence/' + id + '/impact-' + report.contract_sha256.slice(0, 12) + '-' + state.source.digest.slice(0, 12) + '.json';
  const result = await writeNew(state.workspace.repo, artifact, JSON.stringify(report, null, 2) + '\n');
  return { ...result, artifact, report: result.created ? report : await readJson(result.file) };
}
async function verifyArtifact(workspace, entry) {
  const file = await safePath(workspace.repo, entry.artifact);
  const content = await fs.readFile(file);
  if (!content.length) fail('EMPTY_ARTIFACT', 'Evidence artifact is empty: ' + entry.artifact);
  if (hash(content) !== entry.sha256) fail('ARTIFACT_CHANGED', 'Evidence artifact changed after capture: ' + entry.artifact);
  return content;
}
export async function validateEvidence(id, options = {}) {
  const state = await evidenceState(id, options);
  const { receipt } = await readReceipt(state.workspace, id, options);
  await validateSchema('evidence', receipt);
  const errors = [];
  if (receipt.task_id !== id || receipt.task_version !== state.task.metadata.version || receipt.contract_sha256 !== contractHash(state.task)) errors.push('Receipt belongs to a different task/version/contract.');
  if (receipt.source_digest !== state.source.digest) errors.push('Source changed since verification; rerun checks and independent review.');
  const entries = new Map();
  const changed = changedFiles(state.baseline.source.files, state.source.files);
  try { await validateImpact(state, receipt); }
  catch (error) {
    if (!['IMPACT_REQUIRED', 'IMPACT_GATE_FAILED', 'SCHEMA_INVALID'].includes(error.code)) throw error;
    errors.push(error.message, ...(error.details || []));
  }
  for (const entry of receipt.evidence) {
    if (entries.has(entry.id)) errors.push('Duplicate evidence ID: ' + entry.id);
    entries.set(entry.id, entry);
    const content = await verifyArtifact(state.workspace, entry);
    if (entry.kind === 'E1') {
      if (!entry.provider) errors.push('E1 requires a real semantic provider: ' + entry.id);
      if (entry.references !== undefined || entry.inspected !== undefined) {
        if (entry.references === undefined || entry.inspected !== entry.references) errors.push('Semantic reference inspection is incomplete: ' + entry.id);
      }
    }
    if (entry.kind === 'E4') {
      let delta;
      try { delta = JSON.parse(content.toString('utf8').replace(/^\uFEFF/, '')); } catch { errors.push('E4 must use evidence changes output: ' + entry.id); continue; }
      if (delta.task_id !== id || delta.source_digest !== state.source.digest || delta.contract_sha256 !== contractHash(state.task) || delta.baseline_digest !== state.baseline.source.digest || JSON.stringify(delta.changed_files) !== JSON.stringify(changed)) errors.push('E4 change artifact does not match the prepared baseline and current source.');
    }
  }
  const requiredKinds = new Set([...state.task.metadata.required_evidence, ...(state.baseline.required_evidence || []), ...state.task.metadata.dod.flatMap((item) => item.evidence)]);
  for (const kind of requiredKinds) if (!receipt.evidence.some((entry) => entry.kind === kind)) errors.push('Missing required evidence: ' + kind);
  const assignments = new Map();
  for (const item of receipt.dod) {
    if (assignments.has(item.id)) errors.push('Duplicate DoD assignment: ' + item.id);
    if (!state.task.metadata.dod.some((criterion) => criterion.id === item.id)) errors.push('Unknown DoD assignment: ' + item.id);
    assignments.set(item.id, item.evidence);
    for (const reference of item.evidence) if (!entries.has(reference)) errors.push('Unknown evidence ID: ' + reference);
  }
  for (const criterion of state.task.metadata.dod) {
    const ids = assignments.get(criterion.id) || [];
    const kinds = new Set(ids.map((reference) => entries.get(reference)?.kind));
    for (const kind of criterion.evidence) if (!kinds.has(kind)) errors.push(criterion.id + ' lacks linked ' + kind + ' evidence.');
  }
  const outside = changed.filter((file) => !state.task.metadata.expected_write_scope.some((pattern) => matchesPath(file, pattern)));
  for (const file of outside) if (!receipt.scope_expansions.some((expansion) => expansion.paths.includes(file) && expansion.reason.trim())) errors.push('Unexplained mechanical write-scope expansion: ' + file);
  if (state.workspace.config.review.independent && !receipt.review) errors.push('Fresh independent review is required.');
  if (receipt.review) {
    await verifyArtifact(state.workspace, receipt.review);
    if (receipt.review.source_digest !== state.source.digest || receipt.review.contract_sha256 !== contractHash(state.task) || receipt.review.receipt_sha256 !== reviewReceiptHash(receipt)) errors.push('Independent review is stale: source, contract, impact or receipt changed.');
  }
  if (errors.length) fail('EVIDENCE_GATE_FAILED', 'Completion evidence is insufficient', errors);
  return { valid: true, task_id: id, contract_sha256: contractHash(state.task), source_digest: state.source.digest, evidence: receipt.evidence.length, dod: receipt.dod.length, changed_files: changed };
}
export async function finishTask(id, options = {}) {
  const result = await validateEvidence(id, options);
  const workspace = await loadWorkspace(options);
  const { assertIdle } = await import('./maintenance.js');
  await assertIdle(workspace);
  const task = await readTask(workspace, id);
  const { markdown } = await import('./io.js');
  task.metadata.status = 'done';
  await writeManaged(workspace.repo, '.agent/tasks/' + id + '.md', markdown(task.metadata, task.body));
  return { ...result, status: 'done' };
}
