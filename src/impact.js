import fs from 'node:fs/promises';
import { fail, hash, readJson, safePath, validateSchema } from './io.js';
import { contractHash } from './tasks.js';
import { changedFiles } from './snapshot.js';

// A stable receipt binding excludes only the review being attached to it.
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}
export function reviewReceiptHash(receipt) {
  const { review, ...reviewed } = receipt;
  return hash(JSON.stringify(canonical(reviewed)));
}
export async function validateImpact(state, receipt, pointer = receipt.impact) {
  if (!pointer) fail('IMPACT_REQUIRED', 'Completion needs a current, evidence-backed impact report. Run evidence impact.');
  const file = await safePath(state.workspace.repo, pointer.artifact);
  const bytes = await fs.readFile(file);
  if (hash(bytes) !== pointer.sha256) fail('ARTIFACT_CHANGED', 'Impact report changed after capture: ' + pointer.artifact);
  const report = await readJson(file);
  await validateSchema('impact', report);
  const errors = [], changed = changedFiles(state.baseline.source.files, state.source.files);
  if (report.status !== 'complete') errors.push('Impact analysis remains pending.');
  if (report.task_id !== state.task.metadata.id || report.contract_sha256 !== contractHash(state.task) || report.source_digest !== state.source.digest || report.baseline_digest !== state.baseline.source.digest || JSON.stringify(report.changed_files) !== JSON.stringify(changed)) errors.push('Impact report does not match this task, contract, baseline and current source.');
  if (receipt.source_digest !== state.source.digest || receipt.contract_sha256 !== contractHash(state.task)) errors.push('Evidence receipt is stale.');
  if (report.unresolved.length) errors.push('Material impact uncertainties remain unresolved.');
  if (!report.wider_dependencies.trim()) errors.push('State the inspected repository boundary and relevant wider dependencies.');
  if (!changed.length && !report.no_changes_reason.trim()) errors.push('Explain the verified no-change outcome.');
  const entries = new Map(receipt.evidence.map((entry) => [entry.id, entry]));
  const linked = new Set();
  function references(ids, kinds, label) {
    for (const id of ids) {
      const entry = entries.get(id);
      if (!entry || entry.result !== 'passed' || !kinds.includes(entry.kind)) errors.push(label + ' needs real ' + kinds.join('/') + ' evidence: ' + id);
      else linked.add(id);
    }
  }
  const covered = new Set();
  for (const conclusion of report.conclusions) {
    for (const key of ['owner', 'consumers', 'behavior']) if (!conclusion[key].trim()) errors.push('Impact conclusion needs ' + key + ' with relevant source/flow facts.');
    for (const name of conclusion.paths) {
      await safePath(state.workspace.repo, name);
      covered.add(name);
    }
    references(conclusion.evidence, ['E1', 'E2'], 'Impact analysis');
    references(conclusion.checks, ['E2', 'E3', 'E5'], 'Impact verification');
  }
  for (const name of changed) if (!covered.has(name)) errors.push('Impact analysis does not cover changed file: ' + name);
  const queried = new Set();
  function providerReferences(ids, provider) {
    for (const id of ids) if (entries.get(id)?.provider && entries.get(id).provider !== provider) errors.push('Lookup provider differs from captured evidence: ' + id);
  }
  for (const lookup of report.lookups) {
    queried.add(lookup.capability);
    const config = state.workspace.config.tools[lookup.capability];
    if (!config) errors.push('Unknown lookup capability: ' + lookup.capability);
    if (config?.provider_first && lookup.provider !== config.provider) errors.push('Preferred provider was not attempted for ' + lookup.capability);
    if (!lookup.scope.trim()) errors.push('Lookup needs its actual project/query coverage.');
    references(lookup.evidence, ['E1', 'E2'], 'Preferred lookup');
    providerReferences(lookup.evidence, lookup.provider);
    if (lookup.fallback) {
      if (lookup.outcome === 'answered' || !lookup.fallback.reason.trim()) errors.push('Fallback requires an observed limitation or missing result.');
      references(lookup.fallback.evidence, ['E1', 'E2'], 'Fallback lookup');
      providerReferences(lookup.fallback.evidence, lookup.fallback.provider);
    }
  }
  for (const [name, config] of Object.entries(state.workspace.config.tools)) {
    if ((config.impact || config.provider_first && state.baseline.capabilities.some((capability) => capability.name === name)) && !queried.has(name)) errors.push('Missing required capability lookup for impact: ' + name);
  }
  for (const id of linked) {
    const entry = entries.get(id), content = await fs.readFile(await safePath(state.workspace.repo, entry.artifact));
    if (!content.length || hash(content) !== entry.sha256) errors.push('Linked impact evidence changed or is empty: ' + id);
  }
  if (errors.length) fail('IMPACT_GATE_FAILED', 'Impact analysis is incomplete or stale.', errors);
  return report;
}
