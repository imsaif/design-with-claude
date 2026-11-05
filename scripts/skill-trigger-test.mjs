#!/usr/bin/env node
// Measures whether the plugin's skills fire on plain-language requests, in real
// Claude Code sessions. Costs real model usage, so it isn't part of the test suite.
//
//   node scripts/skill-trigger-test.mjs <tuning|holdout|negative|all> [--runs=2] [--case=<id>]
//
// Each run gets a throwaway copy of examples/broken-project, this repo's plugin by
// path, no user settings or hooks, no MCP servers, and a spending cap. Copies sit
// outside ~/.claude because edits are blocked there. A run ends as soon as a skill
// fires, which keeps it cheap. Change a description only against `tuning`; `holdout`
// is how you find out whether the change works on requests it wasn't written for.
//
// Set SLASH_COMMAND_TOOL_CHAR_BUDGET=2000 to imitate a setup crowded with plugins,
// where Claude Code drops descriptions to fit.

import { spawn } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sets = JSON.parse(readFileSync(join(repo, "scripts/skill-trigger-cases.json"), "utf8"));
const argv = process.argv.slice(2);
const flag = (name, fallback) => argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1] ?? fallback;
const setName = argv.find((a) => !a.startsWith("--")) ?? "tuning";
const runs = Number(flag("runs", "2"));
const only = flag("case");
const CONCURRENCY = 4;
const MODEL = flag("model", "sonnet");

const cases = (setName === "all" ? [...sets.tuning, ...sets.holdout, ...sets.negative] : sets[setName]).filter((c) => !only || c.id === only);
const work = mkdtempSync(join(tmpdir(), "dwic-trigger-"));
let seq = 0;

function runOnce(c) {
  const cwd = join(work, `r${seq++}`);
  cpSync(join(repo, "examples/broken-project"), cwd, { recursive: true, filter: (s) => !s.includes(".dwic") });
  return new Promise((done) => {
    const child = spawn(
      "claude",
      ["--setting-sources", "project", "-p", c.prompt, "--plugin-dir", repo, "--strict-mcp-config", "--model", MODEL, "--max-budget-usd", "0.40", "--allowedTools", "Read,Glob,Grep,Skill", "--output-format", "stream-json", "--verbose"],
      { cwd, env: { ...process.env, DWIC_EVENTS: "off", DWIC_TELEMETRY: "off", DWIC_API_URL: "http://127.0.0.1:9" }, stdio: ["ignore", "pipe", "ignore"] },
    );
    let buffer = "";
    const skills = [];
    let cost = 0;
    const kill = setTimeout(() => child.kill("SIGKILL"), 180000);
    child.stdout.on("data", (d) => {
      buffer += d;
      let i;
      while ((i = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, i);
        buffer = buffer.slice(i + 1);
        let e;
        try { e = JSON.parse(line); } catch { continue; }
        if (e.type === "result") cost = e.total_cost_usd ?? 0;
        if (e.type !== "assistant") continue;
        for (const b of e.message?.content ?? []) {
          if (b.type === "tool_use" && b.name === "Skill") {
            skills.push(String(b.input?.skill ?? ""));
            child.kill("SIGTERM");
          }
        }
      }
    });
    child.on("close", () => {
      clearTimeout(kill);
      rmSync(cwd, { recursive: true, force: true });
      done({ skills, cost });
    });
  });
}

const jobs = cases.flatMap((c) => Array.from({ length: runs }, () => c));
const outcome = new Map(cases.map((c) => [c.id, { c, fired: [], total: 0, hits: 0 }]));
let next = 0;
let spent = 0;
async function worker() {
  while (next < jobs.length) {
    const c = jobs[next++];
    const r = await runOnce(c);
    const o = outcome.get(c.id);
    o.total++;
    spent += r.cost;
    o.fired.push(r.skills.map((s) => s.replace("design-with-claude:", "")).join("+") || "-");
    const ours = r.skills.filter((s) => s.startsWith("design-with-claude:"));
    if (c.want ? ours.some((s) => new RegExp(`:(${c.want})$`).test(s)) : ours.length === 0) o.hits++;
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
rmSync(work, { recursive: true, force: true });

const row = (o) => `${String(o.hits).padStart(2)}/${o.total}  ${o.c.id.padEnd(18)} ${o.c.want ? "" : "(should not fire) "}${o.fired.join(", ")}`;
const all = [...outcome.values()];
const pos = all.filter((o) => o.c.want);
const neg = all.filter((o) => !o.c.want);
for (const o of all) console.log(row(o));
const sum = (a, k) => a.reduce((n, o) => n + o[k], 0);
if (pos.length) console.log(`\nFired the right skill: ${sum(pos, "hits")}/${sum(pos, "total")}`);
if (neg.length) console.log(`Correctly stayed quiet: ${sum(neg, "hits")}/${sum(neg, "total")}`);
console.log(`Reported cost so far: $${spent.toFixed(2)} (runs stopped early report nothing, so the real figure is higher)`);
