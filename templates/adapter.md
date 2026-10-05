<!-- agent-workspace:start -->
## Agent Workspace ({{HARNESS}})

This repository uses a portable semi-automated pipeline. Before work, read the global CORE path and repo CORE in '.agent/workspace.yaml', plus existing instructions applicable to the target paths.

The portable CLI invocation is {{CLI}}. Run it from the project root, followed by the command and its arguments. This pins the package version and works on another machine without any path to the installer. A global 'agent-workspace' command is also usable when its version matches this router.

For read-only questions/research, resolve relevant context without creating an implementation task. For a request to plan or implement, resolve the pipeline workflow with 'skills show pipeline' using the invocation above. The agent operates the CLI; the user can send ordinary natural-language requests.

Native skills named 'agent-workspace-pipeline', 'agent-workspace-analyze', 'agent-workspace-interview', 'agent-workspace-plan', 'agent-workspace-tdd', 'agent-workspace-review' and 'agent-workspace-wiki-maintenance' route to these workflows. Use 'skills show <name>' with the canonical name (without the 'agent-workspace-' prefix) to honor project-local overrides. The shared router is '.agent/ADAPTER.md'.

Discuss meaningful unknowns with the human/strong layer, then compile one living Task Contract in '.agent/tasks/<id>.md'. Keep research ephemeral unless durable output was requested. Record approval only after the user's intent/approval actually authorizes its concrete semantics; 'task approve --by' records approval and does not obtain consent. Never ask again for approval already present in the conversation.

Use 'prepare <id> --draft' while planning, and 'prepare <id>' after approval, both with the portable invocation above. Load all mandatory/matched rules and the resolved skills/wiki. Read the global paths from '.agent/workspace.yaml'; default '~' paths belong to the current user. If the global workspace has not been initialized on this machine, run 'setup' with the same invocation first.

Execute the approved contract with the configured strong model and high effort. Preserve semantic scope and read-only governance. Use harness-native tools and lifecycle; delegate only when authorized and useful.

Capture real evidence, request fresh independent review when configured, then use 'agent-workspace evidence validate <id>' and 'task finish <id>'. Harness exit zero alone does not complete a task. Semantic escalation and merge remain human gates.
<!-- agent-workspace:end -->
