---
name: analyze
description: Analyze a feature or bug against current source and derive observable acceptance criteria for a Task Contract.
metadata:
  agent_workspace:
    tags: [analyze, analysis, requirement, architecture, impact, bug]
---

# Analyze the contract

Establish required behavior, current causal path, invariant owner, affected callers/alternate flows and meaningful boundaries from current source and project-scoped semantic tools. Distinguish facts, assumptions and unresolved choices.

Compare plausible fixes against required behavior, contracts, blast radius, complexity and available verification. Choose the smallest correct change; preserve intentional complexity.

Derive observable acceptance criteria and evidence-backed DoD, including relevant rejection/state-transition/regression paths. Ask only for consequential missing semantic decisions. Compile agreed results into the single Task Contract; do not create a separate analysis document by default.
