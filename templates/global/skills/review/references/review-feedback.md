# Evaluate incoming review feedback

Use for PR/MR comments or an existing review report; they do not widen user intent.

1. Read the full feedback, original accepted intent and affected source/tests/rules. Identify the alleged defect and evidence that would establish or refute it before editing.
2. Locate the invariant/state owner and inspect relevant direct/indirect callers and alternate flows. For a shared signature/default, check omitted options as well as explicit branches. Caller-specific behavior belongs at its responsible boundary; preserve other consumers' baseline.
3. Classify from evidence: fix demonstrated in-scope defects; reject unsupported advice with file/line/contract evidence; escalate a new guarantee or unsettled product/public contract with consequences and the smallest recommended alternative. Reviewer labels and confidence grant no authority.
4. Reproduce a feasible logic regression before fixing. Test the changed path, preserved paths and omitted/default options where relevant. Make the smallest complete correction, not a patch that merely satisfies the comment's wording.
5. Run appropriate checks and re-inspect final affected source. Record addressed/rejected/pending findings with evidence. Posting an external reply requires user authorization; internal feedback review alone does not authorize publication.

Changed approved semantics require an internal revision and the actual missing decision before implementation. Changed source needs fresh independent review before claiming the configured completion gate passed.
