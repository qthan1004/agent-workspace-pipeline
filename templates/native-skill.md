# Agent Workspace: {{SKILL}}

Use this skill from the project root. Read '.agent/ADAPTER.md' for the portable CLI invocation and '.agent/workspace.yaml' for this project's context paths.

Append 'skills show {{SKILL}}' to that invocation, read its output, and follow the resolved canonical workflow. This respects project-local overrides in '.agent/skills' before the shared skills. If the configured global home is missing on this machine, run 'setup' using the same invocation first.

Keep the user's requested scope: a request for a plan ends at the plan. Existing authorization remains valid; the CLI records approval rather than obtaining consent. Use current source and real verification evidence.
