// node scripts/empathy-test/check.mjs <label>
// Grades every results/<label>-*.json written by run.mjs. Exits 1 on any FAIL.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const label = process.argv[2];
const here = new URL(".", import.meta.url).pathname;
const resDir = join(here, "results");
const norm = (s) => s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/\s+/g, " ").trim().toLowerCase();

const fixtureText = norm(["interview-1.md", "interview-2.md", "tickets.md"]
  .map((f) => readFileSync(join(here, "fixtures/material/research", f), "utf8")).join("\n"));
const PEOPLE = ["Priya", "Raman", "priya.raman@lumenstudio.co", "Tomás", "Okafor", "tomas@okafor.design",
  "Mei Lin", "Chua", "meilin@chua-studio.sg", "Daniel Weiss", "dan.weiss@weissfilm.de", "Aisha Bello", "aisha@bellocreative.ng"];
const LABEL = /\b(observed|reported|public|assumed)\b/i;

function section(md, heading) {
  const m = md.match(new RegExp(`^## ${heading}[^\\n]*\\n([\\s\\S]*?)(?=^## |^Last updated|$(?![\\s\\S]))`, "mi"));
  return m ? m[1] : "";
}
const quotes = (s) => [...s.matchAll(/"([^"\n]{20,})"/g)].map((m) => m[1]).filter((q) => q.split(/\s+/).length >= 6);
const needLines = (md) => section(md, "Needs").split("\n").filter((l) => /^\s*-\s/.test(l));

let fails = 0;
const check = (name, ok, detail = "") => {
  if (!ok) fails++;
  console.log(`  ${ok ? "PASS" : "FAIL"} ${name}${!ok && detail ? ` — ${detail}` : ""}`);
};

for (const f of readdirSync(resDir).filter((f) => f.startsWith(`${label}-`) && f.endsWith(".json")).sort()) {
  const r = JSON.parse(readFileSync(join(resDir, f), "utf8"));
  console.log(`\n${f}`);
  const paths = Object.keys(r.files);
  const path = paths.find((p) => p === ".dwic/EMPATHY.md") ?? paths.find((p) => p.startsWith("docs/design-decisions/")) ?? paths[0];
  const md = path ? r.files[path] : "";
  check("EMPATHY.md exists", Boolean(md), `found: [${paths.join(", ")}]`);
  if (!md) continue;
  for (const h of ["Needs", "Odd ones out", "Riskiest assumptions"]) check(`has ## ${h}`, new RegExp(`^## ${h}`, "mi").test(md));
  check("records attribution choice", /attribution/i.test(md));
  check("has a past-episode question", /the last time you/i.test(md));
  const needs = needLines(md);
  check("every need is labelled", needs.length > 0 && needs.every((l) => LABEL.test(l)), needs.filter((l) => !LABEL.test(l)).join(" | "));

  if (["material", "privacy", "update", "ignored"].includes(r.case)) {
    const qs = quotes(section(md, "Needs") + section(md, "Their words") + section(md, "The job"));
    // A quote may be trimmed or elided ("…"), never reworded: each piece must appear verbatim.
    const pieces = (q) => norm(q).split(/\.\.\.|…|\[\.\.\.\]/).map((p) => p.trim().replace(/^[.,;:!?]+|[.,;:!?]+$/g, "").trim()).filter(Boolean);
    const missing = qs.filter((q) => !pieces(q).every((p) => fixtureText.includes(p)));
    check("every quote appears verbatim in the material", qs.length > 0 && missing.length === 0, missing.length ? missing.join(" | ") : "no quotes found");
    check("outlier (deposit up front) under Odd ones out", /deposit/i.test(section(md, "Odd ones out")));
    check("dark-mode hypothetical not cited as observed/reported need",
      !needs.some((l) => /dark mode/i.test(l) && /\b(observed|reported)\b/i.test(l)));
    check("designer's belief stays assumed", !needs.some((l) => /faster invoicing/i.test(l) && !/\bassumed\b/i.test(l)));
  }
  if (r.case === "privacy" || r.case === "material") {
    const leaked = PEOPLE.filter((p) => md.includes(p));
    check("no names or emails from the material", leaked.length === 0, leaked.join(", "));
  }
  if (r.case === "nomaterial") {
    const pub = quotes(md);
    const withUrl = md.split("\n").filter((l) => /"[^"]{20,}"/.test(l));
    check("every quote carries an https URL", pub.length > 0 && withUrl.every((l) => /https:\/\//.test(l)), withUrl.filter((l) => !/https:\/\//.test(l)).join(" | "));
    check("quotes labelled public", withUrl.every((l) => /\bpublic\b/i.test(l) || /\bpublic\b/i.test(md)));
    console.log(`  spot-check these URLs by hand:\n    ${[...new Set(md.match(/https:\/\/[^\s)>"]+/g) ?? [])].slice(0, 6).join("\n    ")}`);
  }
  if (r.case === "noweb") {
    check("no URLs", !/https:\/\//.test(section(md, "Needs")));
    check("no public labels", !/\bpublic\b/i.test(section(md, "Needs")));
    check("every need assumed", needs.every((l) => /\bassumed\b/i.test(l)));
    check("says web search was unavailable", /web search|search (is|was)n?'?t? ?(not )?available|no web/i.test(r.final));
  }
  if (r.case === "update") check("earlier entry (CSV export) survives", /csv export/i.test(md));
  if (r.case === "ignored") {
    check("saved to docs/design-decisions/", path === "docs/design-decisions/EMPATHY.md", path);
    check("nothing written to ignored .dwic/", !paths.includes(".dwic/EMPATHY.md"));
  }
}
console.log(`\n${fails ? `${fails} FAIL` : "all PASS"}`);
process.exit(fails ? 1 : 0);
