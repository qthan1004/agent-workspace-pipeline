# Released project knowledge

Keep raw onboarding sources under '.agent/raw/'. Read the wiki paths from '.agent/workspace.yaml'; fresh projects use 'wiki/' (or '.wiki/' when selected), and older projects may retain '.agent/wiki/'. Keep bounded-context pages, summaries, source links and related concepts there. Use MAP.yaml for path, symbol, tag and description routing. Do not create a wiki page for every source file/function.

Pages declare id, version, released_at, status, owner, scope and verified_against. Only active pages are execution context. Drafts are explicit onboarding work, not current truth. The resolver loads at most three relevant pages.

Wiki is orientation. Query project-scoped semantic tools and current source for callers, references and implementation truth. Never make stale wiki override live evidence or weaken rules.

Raw sources and released wiki are read-only in an execution task. Findings go to 'wiki request-fix' with evidence and a proposed change. Human/strong-layer review releases changes in a separate maintenance task. Markdown works without Obsidian, RAG or a database.
