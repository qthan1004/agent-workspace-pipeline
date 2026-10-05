---
name: tdd
description: Verify behavior changes and bug fixes with meaningful regression tests and risk-appropriate test-first feedback.
metadata:
  agent_workspace:
    tags: [test, regression, bug, implement, feature, tdd]
---

# Behavior-first verification

Derive tests from actual requested behavior and the source-backed contract. MUST reproduce a bug or demonstrate a feature fails for the expected behavior reason before a feasible production logic change. A compile/import failure alone is not the regression. Preserve observed RED and subsequent GREEN output.

Choose the smallest test level that proves behavior; add integration/interaction coverage where units miss cross-component failures. Cover evidenced boundaries, alternatives and regressions. Do not tailor assertions to implementation shape, use tautological mocks or weaken existing invariants.

Run relevant focused and broader checks. If a red phase or automated test is infeasible, record the actual limitation and closest meaningful verification. Reversible literal/docs edits do not need ceremonial tests. Capture real output as E5 and inspect the affected surface beyond the diff.

For UI/cross-component flows, observe the required rendered states/actions through the configured runtime/browser and check relevant console/network behavior. Implementer-written tests are not independent proof of understood intent; original criteria and fresh review remain required. Missing required runtime checks remain gaps.
