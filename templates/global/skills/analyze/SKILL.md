---
name: analyze
description: Analyze a feature or bug against current source and derive observable acceptance criteria for a Task Contract.
metadata:
  agent_workspace:
    tags: [analyze, analysis, requirement, architecture, impact, bug]
---

# Analyze the contract

Establish required behavior, current causal path, invariant owner, affected callers/alternate flows and meaningful boundaries from current source and project-scoped semantic tools. Distinguish facts, assumptions and unresolved choices.

Accept ordinary questions, bug descriptions and supplied documents. When the user requests analysis only, return the analysis without requiring a task record or implementation. For a broader requested plan/implementation, the agent carries the findings into its internal contract.

Compare plausible fixes against required behavior, contracts, blast radius, complexity and available verification. Choose the smallest correct change; preserve intentional complexity.

Derive observable acceptance criteria and evidence-backed DoD, including relevant rejection/state-transition/regression paths. Ask only for consequential missing semantic decisions. Compile agreed results into the single Task Contract; do not create a separate analysis document by default.
