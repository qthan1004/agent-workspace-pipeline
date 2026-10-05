<!-- agent-workspace:start -->
## Agent Workspace ({{HARNESS}})

This repository uses a portable semi-automated pipeline. Before work, read the global CORE path and repo CORE in '.agent/workspace.yaml', plus existing instructions applicable to the target paths.

The portable CLI invocation is {{CLI}}. Run it from the project root, followed by the command and its arguments. This pins the package version and works on another machine without any path to the installer. A global 'agent-workspace' command is also usable when its version matches this router.

The user interacts through conversation, questions or supplied documents, including Markdown plans. Infer the requested outcome from the conversation: answer/analyze, plan, implement or review. Read-only questions/research do not create implementation tasks. A supplied file is context; implement only when the user's request authorizes implementation. For a request to plan or implement, resolve the pipeline workflow with 'skills show pipeline' using the invocation above.

All platforms use one project skills directory, '.agent/skills' by default (see 'skills.local' in the config). Resolve a workflow with 'skills show <name>' rather than another platform's similarly named skill. No platform-specific skill copies, links or slash-command registration are required. The shared router is '.agent/ADAPTER.md'.

Available Agent Workspace workflows (read the selected workflow on demand):

{{SKILLS}}

The agent owns task creation and lifecycle as internal bookkeeping. Choose a valid ID, reuse the relevant ongoing task for follow-ups, and write the living Task Contract in '.agent/tasks/<id>.md' when needed. Never require the user to provide an ID, create a task, fill a template, edit a receipt or operate CRUD commands. Derive the contract from conversation and applicable supplied plan/source; retain source references and preserve the original document unless editing it was requested.

Record approval only after the user's request/approval authorizes the concrete semantics. An implementation request can already supply that authorization; 'task approve --by' records it and does not obtain consent. Do not add a mandatory contract sign-off when authorization is already present. Resolve consequential missing decisions through ordinary conversation.

Operate this workflow autonomously within the user's authorized scope: write/update the contract, resolve context, prepare, implement, capture artifacts, obtain the configured independent review and validate completion. Keep task IDs, receipts and CLI mechanics internal unless they help explain an outcome or the user asks to inspect them. Report the requested analysis/plan/result, checks and material blockers. Ask only for consequential missing decisions or permissions not already granted. Read wiki paths from the config; a fresh project uses 'wiki/' and may choose '.wiki/'.

Use 'prepare <id> --draft' while planning, and 'prepare <id>' after approval, both with the portable invocation above. Load all mandatory/matched rules and the resolved skills/wiki. Read the global paths from '.agent/workspace.yaml'; default '~' paths belong to the current user. If the global workspace has not been initialized on this machine, run 'setup' with the same invocation first.

Execute the approved contract with the configured strong model and high effort. Preserve semantic scope and read-only governance. Use harness-native tools and lifecycle; delegate only when authorized and useful.

Capture real evidence, request fresh independent review when configured, then use 'agent-workspace evidence validate <id>' and 'task finish <id>'. Harness exit zero alone does not complete a task. Semantic escalation and merge remain human gates.
<!-- agent-workspace:end -->
