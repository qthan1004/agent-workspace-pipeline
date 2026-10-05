# Decisions combined from the supplied sources

The supplied agent-workspace-plan.md and conversation summary define the portable rules/context/contract/evidence layer. The latest user instruction makes every default role strong/high: Gemini 3.8+, Claude Sonnet/Opus 5.0+, GPT 5.6 Sol/Terra high+. These are the owner's capability targets; actual provider model IDs and availability belong to the harness. The temporary resource folder and archives were removed at the user's request after these decisions were incorporated.

The supplied common-skills.zip contributes understand-before-change, causal/impact analysis, project-scoped semantic tooling, preserved user work, evidence-backed verification, focused interviewing, testable specifications, planning and TDD. Duplicate working-style/personal-behavior principles become CORE; analyze/spec/planning share one living Task Contract. Generic review instructions omit payment-specific examples. The default skills are newly written adaptations, not an unmodified copy of the archive.

The supplied harnix-2.zip was consulted at README.md, workflow/brief.ts, context/selection-freshness.ts and workflow/evidence-flags.ts. Useful ideas are agent-operated workflow routing, concise machine output, current-input digests and fresh evidence gates. Its source, CLI, runtime, task history, hooks and state machine are not imported as runtime dependencies.

The supplied image archive contains a raw/wiki/schema onboarding diagram and a screenshot of that diagram. We retain immutable raw sources, concept pages, source links and explicit governance. Wiki promotion uses reviewed maintenance/proposals; execution never automatically rewrites official knowledge. No claim about the diagram's attribution or model parameter thresholds is needed for this package.

The Kun ecosystem references in the summary contribute principles: AXI-style bounded output and deterministic errors, Firstmate-style independent role separation, no-mistakes-style fresh review and reviewed-source continuity, and Backpass-style evidence-to-proposal learning. No Kun package, account, daemon or service is required by this implementation.

Runtime command syntax was checked against primary documentation:

- [Codex noninteractive execution](https://learn.chatgpt.com/docs/non-interactive-mode): exec, stdin prompt and workspace-write sandbox.
- [Codex repository instructions](https://learn.chatgpt.com/docs/agent-configuration/agents-md): AGENTS.md discovery.
- [Claude noninteractive execution](https://code.claude.com/docs/en/headless): print mode and piped input.
- [Gemini headless execution](https://geminicli.com/docs/cli/headless/): prompt mode.
- [YAML parser](https://eemeli.org/yaml/): YAML/frontmatter parsing.
- [npm package fields](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/): executable and publish files.

Multi-platform initialization installs all four instruction routers by default or a selected subset. Per the user's latest instruction, every platform resolves the same canonical project workflows in .agent/skills. No native skills copies, symlinks or per-platform slash-command registrations are installed. AGENTS.md, CLAUDE.md, GEMINI.md and Antigravity's .agent/rules/agent-workspace.md carry routing instructions and a workflow index.

The platform-specific discovery conventions were checked against primary documentation:
- [Codex skills](https://learn.chatgpt.com/docs/build-skills).
- [Claude skills](https://code.claude.com/docs/en/skills).
- [Gemini skills](https://geminicli.com/docs/cli/using-agent-skills/).
- [Antigravity skills](https://antigravity.google/docs/skills) and [rules](https://www.antigravity.google/docs/rules/), including the supported .agent/rules location and trigger frontmatter.

The shared folder deliberately uses instruction-driven discovery rather than claiming every harness automatically registers native commands from .agent/skills. Local workflows override the same global names through the resolver. Agents operate contract/context/execution/evidence commands themselves; users do not need to fill templates or supervise routine mechanics.

Wiki organization was researched using [GitHub wiki pages](https://docs.github.com/en/communities/documenting-your-project-with-wikis/adding-or-editing-wiki-pages), [GitHub navigation](https://docs.github.com/en/communities/documenting-your-project-with-wikis/creating-a-footer-or-sidebar-for-your-wiki) and [GitLab wiki](https://docs.gitlab.com/user/project/wiki/). These host wiki content in Git repositories and support Markdown/navigation; they do not prescribe a local wiki/ or .wiki/ folder. Our inference for this package is a versioned wiki/ directory next to source, with INDEX.md for orientation and MAP.yaml for agent context routing. --wiki-dir .wiki selects a hidden directory for new projects. Existing configured wiki paths, including .agent/wiki, stay intact. Initialization does not publish or synchronize hosted wikis.
