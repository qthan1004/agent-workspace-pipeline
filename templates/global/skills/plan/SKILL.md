---
name: plan
description: Turn an agreed feature or specification into an ordered implementation plan inside its living Task Contract.
metadata:
  agent_workspace:
    tags: [plan, planning, specification, design]
---

# Compile the implementation plan

Ground the plan in actual source, constraints and known dependencies. Put ordered implementation steps under Decisions in the single contract. Each step has a concrete outcome, necessary dependency and relevant verification.

The input can be a conversational request, specification or supplied Markdown plan. Read the material and current source, identify consequential gaps/conflicts, and retain the relevant source reference. Create/reuse and fill the internal contract yourself; never ask the user for a task ID or a filled template. Present the requested plan in chat or at the user-requested document path.

Carry acceptance/regression cases into implementation steps. Include migration/rollback/release work only when required by scope. Distinguish required work from optional improvements.

A requested plan does not authorize implementation. Do not invent product decisions to make the plan look complete; escalate consequential unknowns.
