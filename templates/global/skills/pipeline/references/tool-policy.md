# Adopt or replace a tool

Use this when the user requests an actual provider change or working policy. A hypothetical example is not an instruction to install its named tool. Do not hardcode a vendor, language or MCP name into shared defaults.

Inspect the current harnesses, registered tools, workspace config and existing provider policy. Identify the actual server/package and consult its authoritative setup/capability documentation. Resolve a materially ambiguous identity or installation scope before dependent changes. Use an existing connection when appropriate. Install/register only within the requested scope, preserve unrelated settings and verify a real project-scoped operation in the applicable harnesses. If credentials or access are missing, report the exact blocker; a provider string does not prove connection or capability.

Persist complementary changes where needed:

- Configuration declares the actual provider for each capability. Existing capabilities can be reused; use a new name only for a genuinely distinct capability. Optional `provider_first: true` expresses first-use policy; `impact: true` makes its attempted use part of the completion impact gate. `required: true` requires availability before execution; it is distinct from a preference with permitted fallback.
- CORE or a mandatory workspace rule describes the user's scope, operations, fallback condition and required evidence for every agent/platform. A scoped specialist is appropriate only for a scoped request. Retire superseded requirements instead of appending conflicting versions.
- A skill/reference supplies only the extra reusable procedure that agents need. Wiki stores verified project/tool context if useful, not a second authoritative copy of the policy.

For a first-provider policy, attempt the actual relevant operation before fallback. Record provider, project/query boundary, result and artifact. An empty result, unavailable connection, unsupported operation, failure or incomplete coverage permits only the fallback authorized by the policy, with the observed reason. An answered query may still lack dynamic/runtime coverage: record incomplete scope and inspect the missing flow. Do not claim the whole tool failed merely because one query returned nothing. Do not rename text search as E1 semantic evidence or treat no results as proof of no callers/impact.

Completion impact compares the prepared baseline to current source and checks owners, relevant direct/indirect consumers, changed/preserved flows and wider dependencies. A repository snapshot covers one repository; local/global analysis must name the actual inspected boundaries and material unknowns. Required semantic/runtime evidence remains required even when fallback is permitted for discovery. An unavailable required check is a blocker, not a pass.

Verify policy discovery through mandatory rule resolution and a realistic task prepare, then test actual tool availability separately. All roles and selected harnesses should honor the same policy; if a harness cannot support it, expose that limitation before dependent execution.
