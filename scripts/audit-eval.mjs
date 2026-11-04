#!/usr/bin/env node
// False-alarm test for `dwic audit` on real public projects. Not part of the test
// suite: it downloads code, and scoring needs a person or reviewer agent to judge
// findings against source.
//
//   node scripts/audit-eval.mjs run <tuning|holdout> <outDir>
//     Downloads the pinned projects (tarballs only, nothing from them is executed),
//     audits each, and writes findings.json plus sample.json: up to 6 errors and
//     warnings per check, spread across projects.
//
//   node scripts/audit-eval.mjs score <outDir>
//     Reads <outDir>/labels.json, an array of { id, label } where label is TP, FP,
//     OPINION or UNCLEAR, and prints rates weighted by how often each check fires.
//
// `tuning` is the set the audit was fixed against, so it can't show how the audit
// does on new code. Quote the `holdout` figure, and don't tune against that set: once
// fixes are made from it, add new projects and treat those as the holdout instead.

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const corpus = JSON.parse(readFileSync(join(repoRoot, "scripts/audit-eval-corpus.json"), "utf8"));
const [, , command, a, b] = process.argv;
const PER_CHECK = 6;

const checkId = (category, message) =>
  `${category}: ` +
  message
    .replace(/#[0-9a-f]{3,8}/gi, "#")
    .replace(/`[^`]*`/g, "`x`")
    .replace(/"[^"]*"/g, '"x"')
    .replace(/\d+(\.\d+)?/g, "N")
    .replace(/\s+/g, " ")
    .slice(0, 60)
    .replace(/\(.*$/, "")
    .trim();

function download(repo, sha, outDir) {
  const root = join(outDir, "corpus", repo.replace("/", "__"));
  if (!existsSync(root)) {
    mkdirSync(root, { recursive: true });
    const tar = `${root}.tgz`;
    const got = spawnSync("curl", ["-sSfL", "--max-time", "180", "-o", tar, `https://codeload.github.com/${repo}/tar.gz/${sha}`]);
    if (got.status !== 0) throw new Error(`download failed: ${repo}`);
    if (spawnSync("tar", ["xzf", tar, "-C", root]).status !== 0) throw new Error(`extract failed: ${repo}`);
  }
  return join(root, readdirSync(root).find((n) => !n.startsWith(".")));
}

function run(set, outDir) {
  const projects = corpus[set];
  if (!projects || !outDir) throw new Error("usage: run <tuning|holdout> <outDir>");
  const findings = [];
  const summary = [];
  for (const [repo, sha] of Object.entries(projects)) {
    const project = download(repo, sha, outDir);
    const r = spawnSync("node", [join(repoRoot, "dist/bin/setup.js"), project, "--no-telemetry", "--no-baseline", "--json"], { encoding: "utf8", maxBuffer: 2e8 });
    const d = JSON.parse(r.stdout);
    const c = { error: 0, warn: 0, info: 0 };
    for (const cat of d.results) {
      for (const f of cat.findings) {
        c[f.severity]++;
        findings.push({ repo, project, category: cat.category, severity: f.severity, subject: f.token || f.element, message: f.message, check: checkId(cat.category, f.message) });
      }
    }
    summary.push({ repo, exit: r.status, css: d.scanned.cssCount, markup: d.scanned.markupCount, capped: d.scanned.cappedAt, ...c });
  }
  const groups = new Map();
  for (const f of findings.filter((x) => x.severity !== "info")) {
    const key = `${f.severity}|${f.check}`;
    groups.set(key, [...(groups.get(key) ?? []), f]);
  }
  const sample = [];
  for (const fs of groups.values()) {
    const byRepo = [...Map.groupBy(fs, (f) => f.repo).values()];
    const picked = [];
    for (let i = 0; picked.length < PER_CHECK && byRepo.some((l) => l.length > i); i++) {
      for (const l of byRepo) if (l[i] && picked.length < PER_CHECK) picked.push(l[i]);
    }
    for (const f of picked) sample.push({ id: sample.length + 1, checkPopulation: fs.length, ...f });
  }
  writeFileSync(join(outDir, "findings.json"), JSON.stringify(findings, null, 1));
  writeFileSync(join(outDir, "sample.json"), JSON.stringify(sample, null, 1));
  console.table(summary);
  console.log(`${findings.length} findings, ${sample.length} sampled for judging: ${join(outDir, "sample.json")}`);
}

function score(outDir) {
  const sample = JSON.parse(readFileSync(join(outDir, "sample.json"), "utf8"));
  const labels = new Map(JSON.parse(readFileSync(join(outDir, "labels.json"), "utf8")).map((l) => [l.id, l.label]));
  const missing = sample.filter((s) => !labels.has(s.id));
  if (missing.length) throw new Error(`no label for ids: ${missing.map((s) => s.id).join(", ")}`);
  const report = (rows, name) => {
    let pop = 0;
    let fp = 0;
    let opinion = 0;
    for (const g of Map.groupBy(rows, (s) => `${s.severity}|${s.check}`).values()) {
      const n = g[0].checkPopulation;
      pop += n;
      fp += (n * g.filter((s) => labels.get(s.id) === "FP").length) / g.length;
      opinion += (n * g.filter((s) => labels.get(s.id) === "OPINION").length) / g.length;
    }
    if (pop) console.log(`${name}: ${rows.length} judged of ${pop}; false alarms ${((fp / pop) * 100).toFixed(1)}%, opinion ${((opinion / pop) * 100).toFixed(1)}%`);
  };
  report(sample, "errors + warnings");
  report(sample.filter((s) => s.severity === "error"), "errors");
  report(sample.filter((s) => s.severity === "warn"), "warnings");
}

if (command === "run") run(a, b && resolve(b));
else if (command === "score" && a) score(resolve(a));
else {
  console.error("usage: audit-eval.mjs run <tuning|holdout> <outDir> | score <outDir>");
  process.exit(1);
}
