# Plan and technical handoff

Use when the user requests technical analysis/documentation, a material flow/contract change needs a maintainable explanation, or existing project docs must be brought up to date. Match the project's documentation location and language. Do not create a new report for every small edit or expose task bookkeeping in product docs.

## During discovery and planning

Produce an actionable account of the requested outcome and inspected baseline:

- Original request/plan/reference and scope, separating supplied requirements from agent choices and unresolved questions.
- Current entry points, state/data owner, input -> processing/transition -> output, direct/indirect consumers and important alternate/error paths. Cite inspected files/symbols; wiki is an orientation source, not proof.
- Before/after behavior and invariants that must remain, including unaffected shared/default callers.
- Ordered implementation slices with required dependencies and verification per slice. Trace acceptance criteria to both a slice and observable evidence; do not use "build succeeds" to stand in for a user flow.
- A test/runtime matrix appropriate to the change: requested path, rejection/error, boundary/state transition, preserved paths, and UI states/viewports if applicable. Required unavailable checks remain gaps.

A plan-only deliverable is explicitly planned, not implemented. Do not fill missing semantics by choosing domain rules or a mockup silently. Ask the critical question; bounded diagrams or proposals can help explain it.

## After implementation

Update the relevant existing doc, or a concise technical document when the deliverable warrants one, using the final source as the basis. Explain actual files/entry points, ownership, data/control flow, exact consequential contracts, error/recovery behavior, preserved scope and how to verify it. Use relative links and a small diagram/table when they improve comprehension.

Distinguish checks actually observed from proposed/manual/unavailable checks. State known limitations and remaining product questions. Remove superseded design claims or mark them planned. Code, tests and technical docs must describe the same final behavior. Do not copy private business examples into shared/global knowledge.

Released wiki/CORE/rules stay protected: a technical doc update is not permission to promote knowledge or change approved semantics. Use the maintenance/change-request workflow where required.
