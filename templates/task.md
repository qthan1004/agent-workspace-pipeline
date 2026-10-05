---
id: "{{ID}}"
status: draft
risk: medium
version: 1
paths: []
symbols: []
tags: []
skills: []
expected_write_scope:
  - TODO
required_capabilities: []
required_evidence:
  - E4
  - E5
acceptance_criteria:
  - id: AC1
    description: TODO observable requested behavior
dod:
  - id: D1
    criterion: TODO prove AC1 and preserve relevant contracts
    acceptance: [AC1]
    evidence: [E4, E5]
---

# Goal
TODO

# User Intent
TODO

# Decisions
TODO

# Constraints
TODO

# Non-goals
TODO

# Acceptance Criteria
See acceptance_criteria in frontmatter; these are the canonical observable checks.

# Known Impact Surface
TODO include relevant callers, flows and contracts with live evidence

# Relevant Project Context
TODO paths, symbols, tags and any relevant released wiki

# Expected Write Scope
See expected_write_scope in frontmatter. Mechanical expansion needs explanation; semantic expansion requires escalation.

# Required Evidence
See required_evidence and dod in frontmatter. Add E1 for shared typed symbols and E3 for observed UI/runtime behavior.

# Definition of Done
See dod in frontmatter. Every acceptance criterion must be covered by artifacts; no unresolved semantic uncertainty.

# Escalation Conditions
Missing required evidence; conflicting requirement; new business/architecture/public contract decision; unrelated semantic scope.
