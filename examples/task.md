---
id: DEMO-1
status: draft
risk: low
version: 1
paths: [src/greet.mjs, test/greet.test.mjs]
symbols: []
tags: [feature, regression]
skills: [tdd]
expected_write_scope: [src/greet.mjs, test/greet.test.mjs]
required_capabilities: []
required_evidence: [E4, E5]
acceptance_criteria:
  - id: AC1
    description: greet("Thanh") returns "Hello, Thanh!".
  - id: AC2
    description: greet() returns "Hello, world!".
dod:
  - id: D1
    criterion: Both greeting behaviors pass executable tests and the changed-file surface is inspected.
    acceptance: [AC1, AC2]
    evidence: [E4, E5]
---

# Goal
Add a greeting helper with an explicit name and a default value.

# User Intent
A small executable example for learning the task pipeline.

# Decisions
Add src/greet.mjs exporting greet(name = "world"). Use Node's built-in test runner. This creates a new private example helper, with no existing public consumers.

# Constraints
No dependencies. Preserve unrelated files and behavior.

# Non-goals
No API, UI, localization or existing shared symbol changes.

# Acceptance Criteria
AC1 and AC2 in frontmatter are canonical.

# Known Impact Surface
New helper and its new tests. Inspect existing source to confirm the names/paths are available; escalate if they already exist.

# Relevant Project Context
Only src/greet.mjs and test/greet.test.mjs in an empty demo project.

# Expected Write Scope
The two exact files in frontmatter. Explain any mechanical expansion.

# Required Evidence
E4 from evidence changes; E5 from an observed node --test command. No existing shared symbol relationships are being changed.

# Definition of Done
D1 proves AC1 and AC2. Required independent review uses current source and contract hashes.

# Escalation Conditions
Existing conflicting files, new public contracts, changed semantics or unavailable verification.
