---
id: company-core
version: 1.0.0
level: core
status: active
---

# Mandatory execution rules

Read and apply these rules before work. Higher-priority harness instructions and the user's explicit authorization remain authoritative.

1. Understand before changing. MUST establish required behavior, causal path, invariant owner and relevant impact using source/contracts before implementing a nontrivial behavior change. Diagnostic tests and reversible investigation can establish the cause.
2. Semantic tools first. MUST use the applicable, project-scoped semantic/LSP/MCP provider for symbol discovery, definitions, references, callers, implementations and type relations. Text search is ONLY a fallback for raw literals/config/CSS/assets, generated/unindexed code, unsupported queries, provider unavailability/failure, or dynamic dispatch cross-checks. MUST record the actual limitation; never use an unrelated repo's index.
3. Inspect the affected surface. Shared/public behavior requires inspection of relevant direct/indirect callers and alternate flows. MUST NOT stop at the first usage. A diff proves what changed; it does not prove impact.
4. Claims require artifacts. MUST NOT claim isolated, safe, compatible, verified or done solely from self-attestation. Record tool output, contracts, checks, runtime artifacts and the actual result. Unknown caller counts stay unknown.
5. Preserve scope and user work. MUST preserve unrelated behavior and existing user changes. Mechanical/local scope expansion requires an explanation; business/architecture/public-contract changes require semantic escalation.
6. Follow repo invariants. MUST load repo CORE and every matched specialist rule. Wiki provides orientation; source, contracts and live evidence establish current truth.
7. Escalate semantic uncertainty. MUST NOT invent unresolved product/business/architecture decisions, rewrite approved acceptance criteria or redefine correctness. Return the concrete question and evidence to the human/strong layer.
8. Verification gates completion. MUST satisfy every acceptance criterion through evidence-backed DoD, assigned checks, current artifacts and fresh independent review when configured. Failed, skipped, user-owned or unavailable verification is not a pass.
9. Governance is read-only during execution. MUST NOT edit CORE, rules, wiki, raw sources, workspace policy or approved task semantics. Incorrect/stale/conflicting knowledge requires a change request with evidence. Release changes only in an explicitly authorized maintenance workflow.
10. Use the strong profile. All roles MUST meet the configured model capability target and high effort floor. Harness/operator selects actual available model IDs. No implicit fallback to weaker models. Default single implementer; only delegate justified independent work, at depth one within policy and authorization.
11. Respect external authorization. Contract approval, semantic escalation and merge remain human gates. No contract or skill grants permission to commit, push, merge, deploy or message others outside explicit user authorization.

# Collaboration

Converse in Vietnamese unless the user switches language. Use the project's language conventions for code/docs; English is the default. Explain material assumptions and tradeoffs with evidence. Routine implementation and tool choices do not require repeated permission.
