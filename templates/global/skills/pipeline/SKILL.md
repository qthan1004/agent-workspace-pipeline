---
name: pipeline
description: Operate conversational tasks and supplied plans through grounded discovery, planning, implementation, technical handoff, evidence and review; pause dependent edits for unresolved user intent.
---

# Agent-operated pipeline

Read '.agent/workspace.yaml', both COREs and instructions for the named project. Reuse the relevant task for follow-ups. Match the latest mode: answer/analysis, plan, implement or review. Questions need no implementation task; planning ends at the plan. A supplied document is context, not implementation authorization by itself.

MUST load analyze for material source/flow investigation. Inspect the request/documents, actual configuration/source/tests and user changes before deciding what to build. Run the CORE self-check. Distinguish requested outcome, established repo facts and agent choices. A screenshot supplies visual evidence, not an unstated stack/backend contract or invented interaction semantics.

MUST load interview and ask when consequential outcome, deliverable, constraints or flow decisions remain missing/conflicting. Keep discovery pending with concrete open questions; wait before dependent edits. Continue independent inspection only within authorization. Routine technical choices inside clear semantics are agent-owned.

Create/reuse the internal contract with 'task new'/'task update'. Fill discovery outcome, sources, inspected flow, decision provenance and open questions. Preserve the user's words/boundaries in User Intent; agent choices/steps belong under Decisions. Keep supplied document references and the original document unless editing it was requested. Users never create IDs, fill contracts/receipts or operate CRUD.

Load plan for ordered outcomes, dependencies and checks. Give a brief context checkpoint before nontrivial implementation. Set discovery ready only when questions are resolved and criteria falsifiable. 'prepare --draft' supports planning; 'task approve --by' records actual authority, including an existing clear implementation request. It cannot resolve missing choices. Pending/legacy discovery and open questions block approval/execution.

Use 'prepare' for the Employee Brief/source baseline. Implement through the current strong/high harness, following tdd and protecting governance. Recheck context and steering after interruptions; revise changed semantics internally and ask only for consequential decisions not already settled.

For material flow/contract changes, update applicable technical documentation using plan's technical-handoff reference; reflect actual implementation and preserved behavior. Keep task bookkeeping separate from project docs and released wiki.

Capture real artifacts with 'evidence init/record', link DoD to entries, obtain configured independent review via 'review prepare' in fresh context, then validate and finish. Review challenges original intent as well as code. Worker success is not user acceptance.

Use CLI '--help' and global 'handbook/agent-operations.md' for internals. Resolve shared workflows via 'skills show'; local '.agent/skills' overrides defaults. Wrong rules/wiki use request-fix, learning uses collect/propose and authorized maintenance. Report outcomes and gaps, keeping bookkeeping internal.
