// The bounded set of agent-config fingerprints the collector knows how to
// count and sample. Denominator definition matches the study #2 method doc §4:
// "repos containing at least one agent-config file".
//
// `query` = GitHub code-search qualifier. `path` = the in-repo file path used
// for the first-commit adoption date (null = count-only, no single path to date).

export const FINGERPRINTS = {
  "CLAUDE.md":       { query: "filename:CLAUDE.md",       path: "CLAUDE.md" },
  "AGENTS.md":       { query: "filename:AGENTS.md",       path: "AGENTS.md" },
  ".cursorrules":    { query: "filename:.cursorrules",    path: ".cursorrules" },
  ".windsurfrules":  { query: "filename:.windsurfrules",  path: ".windsurfrules" },
  ".clinerules":     { query: "filename:.clinerules",     path: ".clinerules" },
  ".aider.conf.yml": { query: "filename:.aider.conf.yml", path: ".aider.conf.yml" },
  // Directory-based rule set: countable, but no single path to date per repo.
  ".cursor/rules":   { query: "path:.cursor/rules",       path: null },
};

export function fingerprintSpec(name) {
  const spec = FINGERPRINTS[name];
  if (!spec) {
    throw new Error(
      `Unknown fingerprint "${name}". Known: ${Object.keys(FINGERPRINTS).join(", ")}`,
    );
  }
  return spec;
}
