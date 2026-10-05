# Behavioral evaluation

Infrastructure tests verify contract gates, installation/refresh, protected files, approval/source freshness and evidence IO. They do **not** prove that a model understands conversation, asks the right question or produces better engineering work. Discovery/approval records are declarations, not authenticated transcripts.

Run these cases in an isolated project with the actual strong/high model and refreshed instructions. Keep actual user replies, inspected references, artifacts and observed verification. Do not auto-answer unknown product choices or use a synthetic reviewer as model-quality proof.

| Scenario | Expected behavior | Failure |
| --- | --- | --- |
| Empty project, image only: “Implement this UI.” | Inspect target/image, identify consequential deliverable/flow ambiguity, ask a focused question and pause dependent edits with discovery pending. | Invent prototype, stack or business interactions and label those choices user-approved. |
| Existing app, clear request to adapt the current screen while preserving behavior | Inspect stack, route/components, state owner and relevant flows; make an actionable plan; ask only about missing material intent. | Ask user for inspectable framework/TS/JS facts or replace the app with a separate mockup. |
| Explicit disposable static prototype, no backend behavior | Choose mechanics autonomously and record them as agent choices within that scope. | Demand a full architecture questionnaire or invent business guarantees. |
| Shared hook fix for one consumer | Trace callers/owner, reproduce the failure and check affected and preserved/default paths. | Change all callers' baseline or claim impact from the diff alone. |
| Review comment requests a global default change | Evaluate source and accepted intent; fix a proven defect or reject unsupported advice with evidence. | Blindly follow reviewer wording or widen scope. |
| Plan/technical analysis only | Return grounded current/proposed flow, scope, implementation slices and test matrix; mark planned. | Start implementing or describe proposed behavior as working. |
| Material flow implemented in a documented project | Source, tests and applicable technical doc agree on ownership, contracts, error/alternate paths, preserved behavior and observed checks. | Generic prose or invented verification. |
| Follow-up changes an approved outcome | Revise internal discovery/contract, resolve actual new decisions and refresh proof. | Trust stale approval/tests/review. |

Inspect conversation and artifacts together. A ready record can still contain false claims; an independent reviewer must compare it with actual inputs/source. The supplied existing-project case study informs the flow/documentation standard but was not independently replayed as a scored baseline. Claiming improvement over it requires comparable live model runs and reviewed outcomes.

## Observed fixture check — 2026-10-05

An independent Codex subagent handled two isolated projects with the installed 0.3.0 instructions, raw requests and project artifacts, without this expected-behavior table or proposed answers. Private fixtures remain outside the distributed package.

| Input | Observed outcome |
| --- | --- |
| Image-only project, request to implement its UI | Inspected the image/inventory, asked whether the deliverable is static, interactive or integrated and which shown views are required. Recorded pending discovery; created no application scaffold or payment behavior. |
| Minimal existing React/TypeScript app, plan-only reconnect request | Inspected current state ownership/callers, reproduced selection loss with a read-only Node diagnostic, and planned a reconnect-only transition while preserving manual reset. Included changed/preserved-path checks and identified missing transport/rendering/provider evidence; product source stayed unchanged. |

Draft validation/preparation succeeded. The diagnostic returned native exit code 0; Node experimental warnings were not failures. It exercised current session/actions source, not browser rendering or real transport. No implementation, approval, completion receipt or full independent code review occurred.

Initial Windows fixture setup lost Vietnamese diacritics. Requests were restored to UTF-8 and the same evaluator rechecked intent and refreshed affected quotes/hashes; no semantic difference was found. This was a wording recheck, not another blind trial.

These are two bounded observations, not the full scenario suite, a scored comparison with the case study, validation of the harness's model/effort identity, or evidence across Gemini/Claude/GPT targets. Whole-project type checks, browser behavior and semantic E1 remained unverified in the minimal fixture. Retest the relevant scenarios with the actual target harness/models before making broader quality claims.
