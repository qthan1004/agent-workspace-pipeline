---
name: pipeline
description: Handle a requested implementation or plan in an Agent Workspace repo using one approved Task Contract, relevant context and evidence gates.
---

# Task/plan pipeline

Use '.agent/workspace.yaml' and both CORE documents. Read-only research/questions do not create implementation tasks. A planning-only request stops at the requested plan/contract; it does not authorize implementation.

For implementation, understand the requirement and impact using current source/semantic tools. Resolve consequential unknowns; keep ordinary investigation ephemeral. Create one contract with 'task new <id>' and fill its frontmatter and sections. It can contain an ordered implementation plan under Decisions without creating separate plan/spec/checklist files.

The agent operates the workflow and CLI. Write the contract, select context, prepare, implement and capture verification artifacts within existing authorization; do not hand these mechanics to the user. Ask only when missing information changes correctness or an action needs permission not already given. Project workflows in '.agent/skills' override shared defaults. Read wiki locations from the config.

Carry observable acceptance criteria, write scope, evidence kinds and DoD into the contract. 'prepare <id> --draft' routes context before approval. Human/strong layer owns semantic decisions. Record already-given authorization with 'task approve <id> --by <authority>'; obtain approval only when missing. Do not equate recording approval with receiving it.

Use 'prepare <id>' to obtain the Employee Brief and execution baseline. Execute through the current harness, keeping the task semantics and protected knowledge read-only. Code, checks and routine mechanics continue autonomously. Semantic uncertainty requires a concrete escalation with evidence.

Capture real artifacts and a receipt with 'evidence init/record'. Assign every DoD its evidence entry IDs. Independent review uses 'review prepare <id>' in fresh context, bound to the same source and contract. Run 'evidence validate' and 'task finish' only after all required work and evidence pass. Do not complete a task from a successful process exit.

Wrong rules/wiki produce 'rules request-fix' or 'wiki request-fix'; never silently modify released knowledge. Learning goes through collect/propose and authorized maintenance.
