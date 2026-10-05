---
name: review
description: Independently review an implementation against its approved contract, current source and evidence, or evaluate existing review findings.
metadata:
  agent_workspace:
    tags: [review, reviewer, feedback]
---

# Fresh independent review

Use the contract, current diff/source, receipt and relevant rules/wiki in fresh context. Challenge the result rather than inheriting the executor's conclusions. Verify artifact substance and current caller/flow/contract impact; a narrow diff is insufficient for shared behavior.

Check every acceptance criterion, DoD, required evidence kind, meaningful regression and unresolved uncertainty. Failed/skipped/user-owned checks are not passes. Bind review output to the source_digest and contract_sha256 supplied by 'review prepare'.

Treat existing reviewer suggestions as hypotheses. Cross-check relevant usages before changing shared defaults/signatures, keep unaffected baseline behavior and place context-dependent choices at the actual invariant owner. Avoid project/payment assumptions in generic reviews.

Record actionable findings with evidence, or a passed review with exact verification scope. The executor may perform mechanical fixes within scope; semantic changes require renewed authorization. Any source change invalidates the previous review.
