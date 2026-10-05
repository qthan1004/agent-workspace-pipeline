---
name: interview
description: Clarify missing or conflicting intent, deliverables, constraints, user flows or product choices after source inspection; required before dependent implementation when these remain uncertain.
metadata:
  agent_workspace:
    tags: [interview, interview-me, discovery, ambiguity, clarification]
---

# Don't guess, please ask

MUST read the request, supplied references and relevant repo facts first. Identify established facts, inspectable unknowns and missing answers that belong to the user. Do not ask for framework/language/file facts available from source; bounded technical investigation is agent-owned.

Ask a focused question that changes outcome, scope, user-visible behavior, integration contract or material risk. Explain consequences plainly, with short viable options and a recommendation when useful. Do not impose a questionnaire or ask everyone to pick TS/JS/framework. Existing constraints may decide those facts; otherwise propose a suitable stack in the context of the clarified deliverable.

For image-to-UI work in an empty/unclear project, establish visual reproduction versus interactive prototype versus an integrated feature, and which shown states/actions/data are required. In an existing project, first inspect its stack, routes/components, domain data and flow. A picture alone cannot authorize simulated payments, countdown rules, extra screens or backend semantics.

MUST keep dependent implementation stopped and discovery pending while a required answer is missing. Silence is not agreement. Never label an agent proposal as the user's decision. Independent authorized inspection can continue.

After a reply, summarize agreed outcome/boundaries and remaining material gaps; update the same contract with actual reply/source references. Stop interviewing when behavior and verification are actionable. Record routine choices as agent choices; do not require manual task fields or redundant approval of authorized mechanics.
