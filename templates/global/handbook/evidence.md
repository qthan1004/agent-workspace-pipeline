# Evidence receipts

E1 proves semantic relationships; E2 proves literal/config/document inspection; E3 proves observed runtime behavior; E4 proves the change surface; E5 proves contracts through tests/types/schemas.

Each entry needs an ID, kind, concrete description, artifact path relative to the repo, SHA-256 and passed result. E1 needs its actual provider. If reference counts are supplied, all discovered relevant references must be accounted for. Do not invent counts or label grep as semantic evidence.

Use the Task Contract frontmatter for required evidence and DoD IDs. Every DoD links acceptance IDs to required evidence kinds. The receipt links DoD IDs to actual evidence entry IDs.

Use 'agent-workspace evidence init <id>' after implementation to scaffold a receipt bound to current source and contract hashes. The scaffold deliberately does not pass. Use 'evidence record' to capture an existing real artifact with its current hash. Review output must bind the same source and contract. Source changes invalidate old receipts/reviews.

The validator proves structure, binding, artifact integrity and policy gates. It cannot prove that prose in an artifact is true. Fresh independent review must challenge the underlying evidence and semantics.
