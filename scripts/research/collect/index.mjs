#!/usr/bin/env node
// Research Scout collector CLI — reusable, deterministic data gathering for
// /design-research studies. Runnable by hand AND by the scheduled agent, so a
// draft's numbers are always reproducible from a single command.
//
//   node scripts/research/collect/index.mjs --fingerprint=CLAUDE.md --sample=30
//   node scripts/research/collect/index.mjs --fingerprint=CLAUDE.md,AGENTS.md --sample=200 --out=docs/research/drafts/2026-07-16-foo.csv
//   node scripts/research/collect/index.mjs --fingerprint=.cursorrules --count-only
//
// Output: writes the sample CSV (same columns as agentic-terminal-sample.csv)
// and prints a directional summary (total_count floor, N, frontend %). Every
// figure is labelled directional per the method doc — the CLI never firms a number.

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fingerprintSpec } from "./fingerprints.mjs";
import { ghRunner, classifyFrontend, fetchClassificationInputs } from "./classify.mjs";
import { searchCount, searchRepos } from "./search.mjs";
import { firstCommitDate } from "./firstCommit.mjs";
import { rowFrom, toCsv } from "./toCsv.mjs";
import { formatCi } from "./stats.mjs";

function parseArgs(argv) {
  const args = { fingerprint: null, sample: 30, out: null, countOnly: false };
  for (const a of argv.slice(2)) {
    if (a.startsWith("--fingerprint=")) args.fingerprint = a.slice("--fingerprint=".length);
    else if (a.startsWith("--sample=")) args.sample = parseInt(a.slice("--sample=".length), 10);
    else if (a.startsWith("--out=")) args.out = a.slice("--out=".length);
    else if (a === "--count-only") args.countOnly = true;
    else if (a === "--help" || a === "-h") args.help = true;
  }
  return args;
}

function usage() {
  console.log(`Research Scout collector

  --fingerprint=<name[,name...]>  agent-config fingerprint(s) to scan (required)
  --sample=<N>                    repos to sample per fingerprint (default 30)
  --out=<path>                    CSV output path (default docs/research/drafts/<date>-<fp>-sample.csv)
  --count-only                    print total_count floors only, no sampling
  --help                          this message

Fingerprints: see scripts/research/collect/fingerprints.mjs`);
}

function verifyAuth(gh) {
  try {
    gh(["auth", "status"]);
  } catch {
    console.error("✗ gh is not authenticated. Run `gh auth login` (or set GH_TOKEN).");
    process.exit(3);
  }
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.fingerprint) {
    usage();
    process.exit(args.fingerprint ? 0 : 2);
  }
  const gh = ghRunner;
  verifyAuth(gh);

  const fingerprints = args.fingerprint.split(",").map((s) => s.trim()).filter(Boolean);
  fingerprints.forEach(fingerprintSpec); // validate all up front

  // --- Scale: directional total_count floors (volatile — disclose as such) ---
  // INSTRUMENT NOTE: this is the REST `search/code` index. It is reproducible
  // (anyone can run the gh command) but returns DIFFERENT totals from the
  // github.com web-UI search index — for some filenames much lower (observed
  // CLAUDE.md ~47K via REST vs ~590K reported from the web UI). Treat REST as a
  // CONSERVATIVE FLOOR and never juxtapose it with a web-UI number without saying so.
  console.log("Scale — REST `search/code` total_count (reproducible; a CONSERVATIVE FLOOR — the");
  console.log("github.com web UI uses a larger index and reports higher. Counts files, not repos):");
  for (const fp of fingerprints) {
    console.log(`  ${fp.padEnd(16)} ${searchCount(fp, gh).toLocaleString("en-US")}`);
  }
  if (args.countOnly) return;

  // --- Sample: repos -> first-commit date + frontend classification ---
  const perFp = Math.max(1, Math.ceil(args.sample / fingerprints.length));
  const rows = [];
  let capHit = false;
  const skipped = { noDate: 0 };

  for (const fp of fingerprints) {
    const { path } = fingerprintSpec(fp);
    const { repos, hitCap } = searchRepos(fp, perFp, gh);
    capHit = capHit || hitCap;
    console.error(`  sampling ${repos.length} ${fp} repos...`);
    for (const repo of repos) {
      const firstCommit = firstCommitDate(repo, path, gh);
      if (!firstCommit) { skipped.noDate++; continue; }
      const inputs = fetchClassificationInputs(repo, gh);
      rows.push(rowFrom({ repo, fingerprint: fp, firstCommit, isFrontend: classifyFrontend(inputs) }));
    }
  }

  // --- Write CSV ---
  const outPath = args.out
    || `docs/research/drafts/${today()}-${fingerprints.join("+").replace(/[^a-zA-Z0-9.+-]/g, "")}-sample.csv`;
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, toCsv(rows));

  // --- Directional summary (never firmed here) ---
  const n = rows.length;
  const frontend = rows.filter((r) => r.is_frontend === 1).length;

  console.log(`\nSample written: ${outPath}`);
  console.log(`  N classified:  ${n}${skipped.noDate ? ` (${skipped.noDate} skipped — no datable first commit)` : ""}`);
  console.log(`  Frontend:      ${frontend}/${formatCi(frontend, n)} — DIRECTIONAL (Wilson 95%)`);
  if (capHit) console.log("  ⚠ 1,000-result search cap hit for at least one fingerprint — sample is relevance-ranked, NOT random.");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
