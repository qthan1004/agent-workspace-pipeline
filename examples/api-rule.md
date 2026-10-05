---
id: api-contract
version: 1.0.0
level: specialist
status: active
owner: api-maintainer
paths: [src/api/**]
symbols: []
tags: [api, public-contract]
capabilities: []
required_evidence: [E4, E5]
---

# API contract

MUST inspect request/response schemas and affected consumers before changing public API behavior. MUST preserve approved compatibility constraints and rejection semantics.

Evidence MUST include the changed-file artifact (E4) and affected schema/type/tests (E5). Add E1 when modifying shared typed symbols; add runtime evidence where the contract requires it.

DO NOT proceed through an unresolved public-contract decision. Escalate conflicting requirements with current schema/consumer evidence.
