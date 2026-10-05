---
name: analyze
description: Establish requested behavior and actual source/data/control flow, state ownership, caller impact and verification for features, bugs or supplied plans before selecting a change.
metadata:
  agent_workspace:
    tags: [analyze, analysis, requirement, architecture, impact, bug]
---

# Ground the requirement in context

MUST inspect applicable instructions, original request/plan, configuration, relevant source/tests and current user changes. Use scoped semantic tools for symbols/callers/types with evidenced fallback under CORE. Wiki/indexes locate candidates; unread source and missing history stay unknown.

Establish desired outcome and actual flow: entry/input, state/data/invariant owner, transitions/errors, output and consumers. Inspect relevant direct/indirect callers, alternate paths and contracts before shared changes. For a new project, separate the inspected empty/existing boundary from the proposed flow. Never import another project's stack or domain conventions.

Separate supplied requirements, sourced facts and agent proposals. Cross-check plans against current code; do not blindly accept stale paths. Name material unknown/conflicting semantics and MUST invoke interview when sources cannot settle them. Do not invent decisions to close gaps.

For bugs, establish reproduction/causal path before selecting a fix. Compare alternatives by required behavior, ownership, compatibility, blast radius, complexity and actual verification. Choose the smallest complete correction; preserve intentional complexity and unrelated defaults.

Derive falsifiable acceptance/DoD with meaningful negative, transition and regression cases. Analysis-only requests return findings without implementation. For requested planning/implementation, carry concise references and flow into discovery; do not create separate analysis docs by default. Use plan's technical-handoff reference for a requested technical document. Discovery is not ready while consequential questions remain.
