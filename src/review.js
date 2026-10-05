import fs from 'node:fs/promises';
import { hash, safePath, writeManaged } from './io.js';
import { evidenceChanges, evidenceState, readReceipt } from './evidence.js';
import { renderBrief } from './prepare.js';
import { capture } from './process.js';
import { reviewReceiptHash, validateImpact } from './impact.js';

export async function prepareReview(id, options = {}) {
  const state = await evidenceState(id, options);
  const { receipt } = await readReceipt(state.workspace, id, options);
  const impact = await validateImpact(state, receipt);
  const receiptDigest = reviewReceiptHash(receipt);
  const changes = await evidenceChanges(id, options);
  let diff = '';
  try {
    const result = await capture('git', ['diff', '--no-ext-diff', '--no-textconv', '--binary', 'HEAD', '--', '.'], state.workspace.repo, { limit: 128 * 1024 });
    diff = result.code === 0 ? result.stdout : 'Git diff unavailable (new/non-git repo); inspect current files using the change artifact.';
  } catch (error) { diff = 'Diff could not be embedded: ' + error.message + '. Reviewer MUST inspect changes directly.'; }
  const prompt = [
    '# Fresh independent review',
    'Use a fresh context. Role: REVIEWER. Read-only. Strong model/high effort. Do not inherit executor conclusions.',
    'Challenge every acceptance criterion, DoD, artifact substance, caller/contract impact, regressions and semantic uncertainty.',
    'Approval identity in this package is a record, not an authentication mechanism. Verify actual human authorization.',
    'First compare User Intent and discovery sources/decisions to the actual request/plan and inspected source. A contract can itself be wrong: an agent-authored decision is not a user decision.',
    'If an original source is unavailable or a material outcome/flow remains ambiguous, name the missing evidence; do not pass the review by trusting discovery.status or an approval label.',
    'Inspect relevant direct/indirect callers, alternate flows and state/invariant owners, preserving shared defaults. Existing review feedback is a hypothesis, not authority to expand product semantics.',
    'Review source_digest: ' + state.source.digest,
    'Review contract_sha256: ' + receipt.contract_sha256,
    'Review receipt_sha256: ' + receiptDigest,
    'A passed review must bind all three exact hashes and identify its reviewer and hashed artifact. Check the impact report against before/after source, owners, callers, flows, wider dependencies and actual verification. Empty tool results do not prove no impact.',
    'Changed files: ' + JSON.stringify(changes.changed_files),
    'Diff may include pre-existing user changes. Use the prepared baseline and current source; inspect untracked/binary changes directly.',
    '\n## Contract and selected context\n' + renderBrief({ ...state.baseline, role: 'REVIEWER', source: state.source }),
    '\n## Evidence Receipt\n' + JSON.stringify(receipt, null, 2),
    '\n## Impact Report\n' + JSON.stringify(impact, null, 2),
    '\n## Change Artifact\n' + JSON.stringify(changes, null, 2),
    '\n## Git diff\n' + diff
  ].join('\n') + '\n';
  const file = await writeManaged(state.workspace.repo, '.agent/prepared/' + id + '/review.md', prompt);
  return { prompt, file, source_digest: state.source.digest, contract_sha256: receipt.contract_sha256, receipt_sha256: receiptDigest };
}
export async function recordReview(id, options = {}) {
  if (!options.by || !options.artifact || options.result !== 'passed') {
    const { fail } = await import('./io.js');
    fail('INVALID_REVIEW_INPUT', 'Provide --by <independent-reviewer> --artifact <review-output> --result passed --source-digest <reviewed-digest> --contract-sha256 <reviewed-contract> --receipt-sha256 <reviewed-receipt>.');
  }
  const state = await evidenceState(id, options);
  const { receipt } = await readReceipt(state.workspace, id, options);
  // Use the hashes supplied by the independent reviewer, never stamp a stale
  // report with the current source digest just because it was recorded now.
  if (options.sourceDigest !== state.source.digest || options.contractSha256 !== receipt.contract_sha256 || options.receiptSha256 !== reviewReceiptHash(receipt)) {
    const { fail } = await import('./io.js');
    fail('REVIEW_STALE', 'Review must supply the exact reviewed source, contract and receipt hashes.');
  }
  await validateImpact(state, receipt);
  const artifact = await safePath(state.workspace.repo, options.artifact);
  receipt.review = { reviewer: options.by, result: 'passed', source_digest: options.sourceDigest, contract_sha256: options.contractSha256, receipt_sha256: options.receiptSha256, artifact: options.artifact, sha256: hash(await fs.readFile(artifact)) };
  await writeManaged(state.workspace.repo, options.file || '.agent/evidence/' + id + '.json', JSON.stringify(receipt, null, 2) + '\n');
  return receipt.review;
}
