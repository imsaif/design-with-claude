#!/usr/bin/env node
// Single source of truth for "what version is this". Mirrors sync-counts.mjs.
//
// The version was hand-maintained in four files. Three are TS constants that
// cannot import package.json without changing the build, so they were copied by
// hand — and setup.ts's copy is the one written into the user's .mcp.json as
// `npx -p dwic-audit@<VERSION>`. A stale copy there pins installs to a release
// that is not the one being shipped, and nothing would have caught it.
//
//   node scripts/sync-version.mjs          rewrite the constants from package.json
//   node scripts/sync-version.mjs --check  exit 1 if any are stale (for CI)

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHECK = process.argv.includes("--check");

const version = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")).version;

const EDITS = [
  { file: "src/server.ts", re: /const PACKAGE_VERSION = "([^"]+)"/, to: `const PACKAGE_VERSION = "${version}"` },
  { file: "src/bin/audit.ts", re: /const CLI_VERSION = "([^"]+)"/, to: `const CLI_VERSION = "${version}"` },
  { file: "src/bin/setup.ts", re: /const VERSION = "([^"]+)"/, to: `const VERSION = "${version}"` },
];

let stale = 0;
const report = [];

for (const { file, re, to } of EDITS) {
  const path = join(ROOT, file);
  const text = readFileSync(path, "utf8");
  const m = text.match(re);
  if (!m) {
    console.error(`✗ pattern not found in ${file} — sync-version.mjs needs updating`);
    process.exitCode = 1;
    continue;
  }
  if (m[0] === to) {
    report.push(`  ok    ${file} — ${m[1]}`);
    continue;
  }
  stale++;
  report.push(`  STALE ${file}\n          was: ${m[1]}\n          now: ${version}`);
  if (!CHECK) writeFileSync(path, text.replace(re, to), "utf8");
}

console.log(`version: ${version} (from package.json)`);
console.log(report.join("\n"));

if (CHECK && stale > 0) {
  console.error(`\n${stale} stale version constant(s). Run: node scripts/sync-version.mjs`);
  process.exit(1);
}
if (!CHECK && stale > 0) console.log(`\nUpdated ${stale} file(s).`);
