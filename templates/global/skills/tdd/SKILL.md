---
name: tdd
description: Verify behavior changes and bug fixes with meaningful regression tests and risk-appropriate test-first feedback.
metadata:
  agent_workspace:
    tags: [test, regression, bug, implement, feature, tdd]
---

# Behavior-first verification

Derive tests from the contract. For a bug, reproduce the failing regression; for a feature, demonstrate the requested behavior fails for the expected reason before production implementation when executable tests are feasible.

Choose the smallest test level that proves behavior; add integration/interaction coverage where units miss cross-component failures. Cover evidenced boundaries, alternatives and regressions. Do not tailor assertions to implementation shape, use tautological mocks or weaken existing invariants.

Run relevant focused and broader checks. If a red phase or automated test is infeasible, record the actual limitation and closest meaningful verification. Reversible literal/docs edits do not need ceremonial tests. Capture real output as E5 and inspect the affected surface beyond the diff.
