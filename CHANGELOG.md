# Changelog

## 0.2.1

- Make conversation, questions and supplied Markdown plans the user interface; agents own task IDs, contracts, CLI operations, evidence and status transitions.
- Reuse relevant tasks for follow-ups, preserve original plan documents, and record authorization already supplied by implementation requests without extra contract sign-offs.
- Keep analysis and planning within the requested scope; receiving a document alone does not authorize implementation.
- Focus onboarding on installation, available workflows and ordinary conversation examples; move detailed CRUD procedures to an agent operations handbook.
- Install the handbook and its examples into the shared home so agents can consult them without cloning package source.

## 0.2.0

- Init installs Codex, Claude, Gemini and Antigravity instruction routers together by default; choose a subset with CSV or repeated --with flags.
- Keep one canonical project workflow set in .agent/skills for every platform, with agent-operated discovery through instructions and CLI.
- Place new project knowledge in wiki/ by default; --wiki-dir .wiki selects another directory and existing configured wiki paths remain intact.
- Add missing instructions and workflows without replacing user content; --refresh changes only the package-managed instruction blocks.
- Antigravity uses .agent/rules with always_on frontmatter; shared skills, rules and configured wiki participate in protected governance fingerprints.
- Rewrite Vietnamese onboarding around one-command installation, resulting folders, seven workflows, prompts and agent-operated task completion.
- Verify multi-platform selection, shared workflow preservation, protected knowledge, wiki placement/CRUD/legacy paths and portable npm/npx installation.

## 0.1.0

- Public npm package identity: agent-workspace-pipeline; executable: agent-workspace.
- Project initialization with init, optional shared-home initialization with setup.
- Portable, version-pinned npm or GitHub Release invocations in all harness routers; refresh replaces only the managed router block.
- Rules/wiki/skills routing, living Task Contracts, approval hashes and evidence/DoD completion gates.
- Codex, Claude, Gemini, Antigravity and generic instruction adapters.
- Governed task/rule/wiki CRUD, maintenance proposals and learning capture.
- Vietnamese usage guide and registry installation checks.
- Source fingerprints also cover standalone workspaces ignored by a parent Git repository.
