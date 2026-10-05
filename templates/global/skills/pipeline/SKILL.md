---
name: pipeline
description: Turn a conversational request or supplied plan into an agent-operated implementation or plan, managing internal task records, context and evidence.
---

# Task/plan pipeline

Use '.agent/workspace.yaml' and both CORE documents. Infer the requested outcome from conversation and supplied material. Answer read-only questions/research without creating an implementation task. A planning-only request ends at the requested plan; a supplied file alone does not authorize implementation.

For requested planning or implementation, inspect current source and relevant supplied documents, including Markdown plans. Carry their applicable requirements and source references into one living contract; preserve the original document unless editing it was requested. Resolve consequential unknowns through normal conversation.

Choose a valid task ID and create the internal record with 'task new <id>', or continue the relevant existing task for follow-ups. Fill its frontmatter and sections yourself; use Decisions for implementation steps. The user never needs to name/create a task, edit its contract/receipt, run CLI commands or manage status. When a follow-up changes approved semantics, revise the internal contract with 'task update' and record authorization for that revision from the current conversation.

Carry observable acceptance criteria, write scope, evidence kinds and DoD into the contract. 'prepare <id> --draft' routes context while planning. 'task approve <id> --by <authority>' records actual authorization for the concrete semantics; an implementation request can already provide it. Do not ask for an additional contract sign-off when authorization exists. Ask only for consequential missing decisions or permissions.

Use 'prepare <id>' to obtain the Employee Brief and execution baseline. Execute through the current harness, keeping the task semantics and protected knowledge read-only. Code, checks and routine mechanics continue autonomously. Semantic uncertainty requires a concrete escalation with evidence.

Capture real artifacts and a receipt with 'evidence init/record'. Assign every DoD its evidence entry IDs. Independent review uses 'review prepare <id>' in fresh context, bound to the same source and contract. Run 'evidence validate' and 'task finish' only after all required work and evidence pass. Do not complete a task from a successful process exit.

Return the requested answer, plan or implemented result with verification and material blockers. Keep IDs, contracts and CLI mechanics internal unless useful for the user's requested handoff or inspection. Project workflows in '.agent/skills' override shared defaults; read wiki locations from the config. Use CLI '--help' for command syntax; the configured global home has 'handbook/agent-operations.md' for detailed procedures when needed.

Wrong rules/wiki produce 'rules request-fix' or 'wiki request-fix'; never silently modify released knowledge. Learning goes through collect/propose and authorized maintenance.
