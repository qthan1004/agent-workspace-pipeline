---
name: plan
description: Compile a grounded request or supplied specification into a decision-complete implementation plan with acceptance, source context, dependencies, verification and relevant technical documentation.
metadata:
  agent_workspace:
    tags: [plan, planning, specification, design]
---

# Compile and check readiness

Read the request, documents and current source/flow analysis. Resolve consequential gaps through interview; never hide product choices in implementation steps. Technical design is the agent's judgment within known intent.

Fill one living internal contract: preserve User Intent and references, record decision provenance, and order bounded implementation outcomes under Decisions. Include necessary dependencies, meaningful test-first checks for feasible logic changes, and final regression/runtime checks. Map every acceptance criterion to concrete work and evidence-backed DoD; distinguish required work from optional improvements.

MUST self-review before discovery ready/approval: outcome/deliverable clear; actual source/state ownership/alternate flows inspected; material choices settled; relevant contracts/edge cases exact; checks can falsify correctness; user changes/non-goals preserved; no stale conflict, placeholder or open product choice. Structural validation alone does not prove these facts.

For requested technical analysis, significant changed flows/contracts, or existing docs that need updating, read [references/technical-handoff.md](references/technical-handoff.md). Keep plan, implementation and final technical facts consistent; do not turn every task into a documentation project.

Give a concise context checkpoint before nontrivial implementation. Planning-only requests end at the requested plan; clear authorized implementation needs no extra sign-off. The agent handles IDs/CRUD/revisions and asks only for missing consequential decisions or new permission.
