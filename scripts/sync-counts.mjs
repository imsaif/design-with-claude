#!/usr/bin/env node
// Single source of truth for "how many skills does dwc have".
//
// The count was hand-maintained in five files and had drifted to four different
// numbers (29 / 38 / 44 / 45) against a real count of 46. Every added command
// meant five manual edits, so drift was inevitable rather than careless.
//
//   node scripts/sync-counts.mjs          rewrite the counts
//   node scripts/sync-counts.mjs --check  exit 1 if any are stale (for CI)

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHECK = process.argv.includes("--check");

// Beginner walkthroughs rather than design specialists. Keep in sync with the
// same list in scripts that treat these two groups differently.
const TECHNICAL_GUIDES = new Set([
  "setup-guide",
  "environment-setup",
  "database-setup",
  "deploy-to-vercel",
  "debug-helper",
  "code-explainer",
  "auth-implementation",
  "briefing-claude",
]);

const slugs = readdirSync(join(ROOT, "commands"))
  .filter((f) => f.endsWith(".md"))
  .map((f) => f.slice(0, -3));

const total = slugs.length;
const technical = slugs.filter((s) => TECHNICAL_GUIDES.has(s)).length;
const specialists = total - technical;
// design-brief is the router; it counts the *others* it can route to.
const routable = total - 1;

const EDITS = [
  {
    file: ".claude-plugin/plugin.json",
    re: /(\d+) specialized design skills/,
    to: `${total} specialized design skills`,
  },
  {
    file: ".claude-plugin/marketplace.json",
    re: /fix it with (\d+) specialists/,
    to: `fix it with ${total} specialists`,
  },
  {
    file: ".claude-plugin/marketplace.json",
    re: /with (\d+) design specialists:/,
    to: `with ${total} design specialists:`,
  },
  {
    file: "skills/design-with-claude/SKILL.md",
    re: /Routes to (\d+) domain specialists/,
    to: `Routes to ${total} domain specialists`,
  },
  {
    file: "commands/design-brief.md",
    re: /a library of (\d+) specialized agents/,
    to: `a library of ${routable} specialized agents`,
  },
  {
    file: "README.md",
    re: /\*\*(\d+) design skills across 8 categories\*\* \((\d+) design specialists and (\d+) technical guides/,
    to: `**${total} design skills across 8 categories** (${specialists} design specialists and ${technical} technical guides`,
  },
  {
    file: "README.md",
    re: /identifies the relevant design domains \(out of (\d+)\)/,
    to: `identifies the relevant design domains (out of ${routable})`,
  },
];

let stale = 0;
const report = [];

for (const { file, re, to } of EDITS) {
  const path = join(ROOT, file);
  const text = readFileSync(path, "utf8");
  const m = text.match(re);
  if (!m) {
    console.error(`✗ pattern not found in ${file} — sync-counts.mjs needs updating`);
    process.exitCode = 1;
    continue;
  }
  if (m[0] === to) {
    report.push(`  ok    ${file} — ${m[0]}`);
    continue;
  }
  stale++;
  report.push(`  STALE ${file}\n          was: ${m[0]}\n          now: ${to}`);
  if (!CHECK) writeFileSync(path, text.replace(re, to), "utf8");
}

console.log(`commands: ${total} total = ${specialists} specialists + ${technical} technical guides`);
console.log(report.join("\n"));

if (CHECK && stale > 0) {
  console.error(`\n${stale} stale count(s). Run: node scripts/sync-counts.mjs`);
  process.exit(1);
}
if (!CHECK && stale > 0) console.log(`\nUpdated ${stale} file(s).`);
