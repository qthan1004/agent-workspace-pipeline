import fs from 'node:fs/promises';
import path from 'node:path';
import { fail, safePath, writeManaged } from './io.js';
import { harnesses, loadWorkspace } from './workspace.js';
import { contractHash, readTask, requireApproved, validateTaskContent } from './tasks.js';
import { queryInput, resolveContext } from './resolver.js';
import { assertGovernance, governanceSnapshot, sourceSnapshot } from './snapshot.js';

export function capabilityRequirements(workspace, names) {
  return [...new Set(names)].sort().map((name) => ({ name, provider: workspace.config.tools[name]?.provider || null, configured: Boolean(workspace.config.tools[name]?.provider) }));
}
export function renderBrief(manifest) {
  const output = [
    '# Employee Brief',
    'Harness: ' + manifest.harness + ' | Role: ' + (manifest.role || 'IMPLEMENTER') + ' | Risk: ' + manifest.task.risk,
    'Strong model targets: ' + manifest.execution.model_targets.join('; ') + '. Minimum effort: high.',
    'Use the current harness/operator model mapping. Target labels are requirements, not verified API model IDs.',
    'Task approval records authorization; it does not grant additional external permissions.',
    'Discovery provenance is supplied evidence, not authenticated user consent. Recheck the actual request/source; stop for material contradictions or unknowns before dependent edits.',
    '\n## Approved semantics / planning draft\n' + manifest.contract,
    '\n## Execution policy\n' + JSON.stringify(manifest.execution, null, 2),
    '\n## Required capabilities\n' + JSON.stringify(manifest.capabilities, null, 2),
    'Configured providers must be available in this harness and bound to this repo. Configuration is not live tool evidence.'
  ];
  output.push('Required evidence kinds: ' + (manifest.required_evidence || []).join(', '));
  for (const group of ['rules', 'wiki', 'skills']) {
    output.push('\n## ' + group);
    for (const item of manifest.context[group]) output.push('\n### ' + item.id + '\nSource: ' + item.file + '\nSelection: ' + item.reasons.join('; ') + '\n\n' + item.text);
  }
  output.push('\n## Execution and completion',
    'Rules, wiki, raw sources, policy, skills and approved task semantics are read-only. Propose corrections with evidence.',
    manifest.role === 'REVIEWER' ? 'Review only; do not implement, modify source or record approval.' : 'Execute only approved behavior; explain mechanical scope expansion and escalate semantic uncertainty.',
    'Record real E1–E5 artifacts and evidence-backed DoD. Required review uses fresh context and current source/contract hashes.',
    'Run evidence validate and task finish only after completion gates pass. A harness exit code of zero is not DONE.',
    'Source baseline digest: ' + manifest.source.digest,
    'Contract SHA-256: ' + manifest.task.contract_sha256);
  return output.join('\n') + '\n';
}
export async function prepare(id, options = {}) {
  const workspace = await loadWorkspace(options);
  const task = await readTask(workspace, id);
  if (options.draft) validateTaskContent(task, { draft: true }); else requireApproved(task);
  const harness = options.format || options.with || 'generic';
  if (!harnesses.includes(harness) && !Object.hasOwn(workspace.config.adapters || {}, harness)) fail('UNKNOWN_HARNESS', 'Unknown output adapter: ' + harness);
  const goal = task.body.split(/^# /m).filter((part) => /^(Goal|User Intent|Decisions)\n/.test(part)).join('\n');
  const context = await resolveContext(workspace, queryInput(goal, task.metadata));
  const requiredEvidence = [...new Set([...task.metadata.required_evidence, ...task.metadata.dod.flatMap((item) => item.evidence), ...context.rules.flatMap((rule) => rule.metadata.required_evidence || [])])];
  const required = [...context.capabilities, ...task.metadata.required_capabilities];
  if (requiredEvidence.includes('E1') && !required.some((name) => /semantic/.test(name))) required.push('semantic');
  if (requiredEvidence.includes('E3') && task.metadata.tags.some((tag) => ['ui', 'browser', 'frontend'].includes(tag.toLowerCase()))) required.push('browser');
  const governance = await governanceSnapshot(workspace);
  const source = await sourceSnapshot(workspace);
  const manifest = {
    version: 1, harness, repo: workspace.repo, created_at: new Date().toISOString(),
    task: { id, version: task.metadata.version, risk: task.metadata.risk, status: task.metadata.status, contract_sha256: contractHash(task) },
    contract: task.text, context, capabilities: capabilityRequirements(workspace, required),
    required_evidence: requiredEvidence,
    execution: { ...workspace.config.execution, minimum_effort: 'high', model_targets: workspace.config.execution.model_targets || ['Configured strong model'] },
    review: workspace.config.review, governance, source
  };
  const prompt = renderBrief(manifest);
  manifest.metrics = { wiki_pages: context.wiki.length, rules: context.rules.length, skills: context.skills.length, context_bytes: Buffer.byteLength(prompt), approximate_tokens: Math.ceil(prompt.length / 4) };
  const prefix = '.agent/prepared/' + id + (options.draft ? '/draft' : '');
  const baselinePath = await safePath(workspace.repo, prefix + '/manifest.json');
  // Preparing again must not silently forgive protected mutations or erase the
  // original source/write-scope baseline for the same approved contract.
  try {
    const previous = JSON.parse(await fs.readFile(baselinePath, 'utf8'));
    if (!options.draft && previous.task.contract_sha256 === manifest.task.contract_sha256) {
      await assertGovernance(workspace, previous.governance);
      manifest.source = previous.source;
    }
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const finalPrompt = renderBrief(manifest);
  await writeManaged(workspace.repo, prefix + '/manifest.json', JSON.stringify(manifest, null, 2) + '\n');
  const promptFile = await writeManaged(workspace.repo, prefix + '/prompt.md', finalPrompt);
  return { manifest, prompt: finalPrompt, promptFile };
}
export async function readPrepared(workspace, id) {
  const file = await safePath(workspace.repo, '.agent/prepared/' + id + '/manifest.json');
  let manifest;
  try { manifest = JSON.parse(await fs.readFile(file, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') fail('NOT_PREPARED', 'Run prepare <id> before execution or evidence validation.'); throw error; }
  if (manifest.version !== 1 || manifest.task?.id !== id || manifest.repo !== workspace.repo) fail('INVALID_BASELINE', 'Prepared baseline does not match this task/repo.');
  return manifest;
}
