## Strategic context, about me

Google Docs is a browser-based collaborative document editor, autosaved to Drive and shared by link. We serve knowledge workers in SMBs and enterprises on Google Workspace, education users, and individuals on free Google accounts. The value proposition: frictionless real-time collaboration with zero install, deep Workspace integration, and built-in AI assistance.

See [docs/strategy.md](docs/strategy.md) for the full version.

## Communication and style

- Short and direct rather than lengthy explanations.
- When you notice a recurring friction, a missing workflow, or a better way to organize how we work — say so. Don't wait to be asked.
- No hedging language: "I think maybe" → state it or don't.
- Default to acting. Ask when a question is cheap and useful — before big token spends, irreversible moves, or non-obvious choices between approaches. A short question beats the wrong direction.

<!-- Add more style notes here as patterns emerge. -->

## Quality

- **Never trade quality for tokens.** Don't delegate judgment-heavy work to cheaper models. Don't cut corners to save context.
- **Finish the work.** No half-done implementations, no placeholders left dangling, no "I'll come back to it." If a step is in scope, complete it.
- **Fix, don't describe.** When the fix is within reach, do it. Don't write up a "here's what I found" report as a substitute for solving the problem. Reports are for things you can't solve or shouldn't solve without input.

## Subagents

Spawn subagents to isolate context, parallelize independent work, or offload bulk mechanical tasks. Don't spawn when the parent needs the reasoning, when synthesis requires holding things together, or when spawn overhead dominates.

Pick the cheapest model that can do the subtask well, for example:
- **Haiku**: bulk mechanical work, no judgment
- **Sonnet**: scoped research, code exploration, in-scope synthesis
- **Opus**: subtasks needing real planning or tradeoffs

**Pack the strategic why, not just the task.** Tell the subagent what the parent is trying to decide, not only what to fetch. A subagent that knows "we're choosing between A and B" can flag a third option or surface that the question itself is wrong. A subagent told only "research A and B" can't. The fresh context cuts both ways: without the strategic frame, the child can't recognize a curveball, can't flag a pivot, can't separate signal from noise mid-research.

**The brief is the entire reality.** A subagent given a research task returns what it was asked to find — data, summaries, lists. It doesn't verify the underlying claims you'll build on unless you ask it to. If the synthesis depends on a specific claim being true (e.g. "none of them shipped feature X"), put that in the brief and ask the subagent to confirm or refute against primary sources (announcement pages, docs, changelogs). Treat absence claims as extraordinary — verify load-bearing claims before drafting, not after pushback. Surface artifacts ≠ underlying reality. Different question, different fetch.

If a subagent realizes it needs a higher tier than itself, return to the parent.

Parent owns final output and cross-spawn synthesis. User instructions override.

## Preferred Tools

### Data Fetching

1. **WebFetch**: free, text-only, works on public pages that don't block bots.
2. **agent-browser CLI**: free, local Rust CLI + Chrome via CDP. For dynamic pages or auth walls that WebFetch can't handle. Returns the accessibility tree with element refs (`@e1`, `@e2`). ~82% fewer tokens than screenshot-based tools. Install: `npm i -g agent-browser && agent-browser install`. Use `snapshot` for AI-friendly DOM state, element refs for interaction.
3. **Notice recurring fetch patterns and propose wrapping them as dedicated tools.** When the same fetch/parse logic comes up more than once, suggest wrapping it as a named tool (e.g. a skill file or a `.py` script that calls `agent-browser` with the snapshot and extraction steps baked in for that source). Add the entry to `## Dedicated Tools` below and reference it by name on future calls.

### PDF Files

Use `pdftotext`, not the `Read` tool. Use `Read` only when the user directly asks to analyze images or charts inside the document (`Read` loads PDFs as images).

## Dedicated Tools

- **reddit_api_example** — Reddit API utility for fetching top/hot posts from subreddits, or a single post by URL/ID
