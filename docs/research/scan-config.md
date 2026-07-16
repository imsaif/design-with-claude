# Research Scout — scan config (the menu)

The bounded search space the agent draws candidate angles from, so runs stay
focused and comparable over time. The agent may **propose** additions (in a PR),
but does not silently expand scope.

Fingerprint search qualifiers + first-commit paths live in code:
`scripts/research/collect/fingerprints.mjs`. This doc is the *research menu* on top
of them — the axes worth measuring, not the plumbing.

## Agent-config fingerprints (the denominator population)

Repos containing at least one agent-config file:
`CLAUDE.md`, `AGENTS.md`, `.cursorrules`, `.cursor/rules/*`, `.windsurfrules`,
`.clinerules`, `.aider.conf.yml`.

## Dimensions worth measuring

Each dimension is a potential study axis over the population above. A run picks a
rotating subset to scan cheaply, then proposes the most novel + material one.

1. **Adoption over time** — first-commit date of the config file, by quarter. *(Covered by study #2 for the union; sub-cuts by tool/ecosystem may still be novel.)*
2. **Frontend vs non-frontend split** — `package.json` deps + primary language. *(Covered by study #2 at the union level.)*
3. **Tool composition** — share of each fingerprint within the population. *(Partially covered.)*
4. **Co-occurrence** — repos carrying MORE than one fingerprint (CLAUDE.md + AGENTS.md, etc.). *(Open.)*
5. **MCP adoption** — presence of `.mcp.json` / MCP config among agent-config repos. *(Open.)*
6. **Framework mix** — which frontend frameworks dominate the UI-building subset (Next vs Vite vs Astro...). *(Open.)*
7. **Config-file size / structure** — do CLAUDE.md files grow, section conventions, rules-count. *(Open.)*
8. **Monorepo vs single-app** — workspace markers among the population. *(Open.)*
9. **Language ecosystem** — primary language distribution of agent-config repos (is it JS-heavy or broad?). *(Open.)*

## Novelty gate (when to draft)

Draft ONLY when a candidate is:
- **Not covered** by an existing study (`web/app/design-research/*/data.ts`) or already
  marked `drafted`/`rejected-thin` in `scan-log.md`, AND
- **Measurable** via the collector (GitHub search + core API), AND
- **Reachable** to a sample of n ≈ 250+ after the 1,000-result cap + dedup, AND
- **Non-obvious** — the answer isn't already common knowledge.

If nothing clears the bar, the run appends observations to `scan-log.md` and exits cheap.
