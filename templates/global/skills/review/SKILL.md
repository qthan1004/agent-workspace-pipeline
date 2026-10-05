---
name: review
description: Independently check original intent, implementation and technical docs against current source and evidence, or evaluate incoming review feedback before fixing it.
metadata:
  agent_workspace:
    tags: [review, review-me, reviewer, feedback, mr-review-fix]
---

# Review intent and implementation

For independent review, use fresh context and 'review prepare' with original request/plan references, contract, current source/diff and receipt. MUST compare User Intent and discovery decisions to their actual sources first. The executor's task can misstate the request. Missing original evidence or unresolved intent blocks pass; ready/approval labels do not settle semantics.

Inspect invariant/state ownership, relevant direct/indirect callers and alternate flows. Check every acceptance/DoD, artifact substance, required evidence and regressions. A narrow diff, self-written tests, one screenshot or process success alone cannot prove the requested flow. Failed/skipped/unavailable required checks are not passes. Check technical docs against implemented behavior, including preserved boundaries and known limitations.

For PR/MR feedback or "review me"/"fix review feedback", read [references/review-feedback.md](references/review-feedback.md). Suggestions are hypotheses, not authority to amend intent.

Return actionable findings with source evidence, consequence and smallest in-scope correction. Pass identifies actual verification scope and exact source_digest/contract_sha256. Mechanical fixes can proceed within authority; semantic expansion requires clarification. Code changes invalidate prior review. Never impersonate an independent reviewer without a fresh reviewer/context.
