// node scripts/empathy-test/check.mjs <label>
// Grades every results/<label>-*.json written by run.mjs. Exits 1 on any FAIL.
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const label = process.argv[2];
const here = new URL(".", import.meta.url).pathname;
const resDir = join(here, "results");
const norm = (s) => s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/\s+/g, " ").trim().toLowerCase();

const fixtureText = norm(["interview-1.md", "interview-2.md", "tickets.md"]
  .map((f) => readFileSync(join(here, "fixtures/material/research", f), "utf8")).join("\n"));
// First names, surnames and email domains separately: a leak in prose ("Aisha's wish") counts.
const PEOPLE = ["Priya", "Raman", "Tomás", "Tomas", "Okafor", "Mei Lin", "Chua", "Daniel", "Weiss", "Aisha", "Bello",
  "lumenstudio", "okafor.design", "chua-studio", "weissfilm", "bellocreative"];
const LABEL = /\b(observed|reported|public|recalled|assumed)\b/i;

function section(md, heading) {
  const m = md.match(new RegExp(`^## ${heading}[^\\n]*\\n([\\s\\S]*?)(?=^## |^Last updated|$(?![\\s\\S]))`, "mi"));
  return m ? m[1] : "";
}
// A quote opens after a line start, space or "(" and closes before space, punctuation or line end,
// so a word in scare quotes ("Would" statements) never pairs with the next quote on the line.
const quotes = (s) => [...s.matchAll(/(?:^|[\s(])"([^"\n]{20,}?)"(?=[\s).,;:·]|$)/gm)].map((m) => m[1]).filter((q) => q.split(/\s+/).length >= 6);
// Suggested interview questions are quoted too, but they are prompts, not evidence.
// The designer's own answers are quoted too; they are beliefs, not public evidence.
const isQuestionLine = (l) => /the last time|tell me about|cheapest test|next question|designer'?s? (answers?|belief)|designer said/i.test(l);
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
  if (r.case === "partial") {
    // Nothing answered, nothing confirmed: the command must ask and record nothing about people.
    const recorded = /\b(observed|reported|public|recalled|assumed)\b/i.test(section(md, "Needs") + section(md, "Assumptions in the code"));
    check("writes nothing about people when answers and confirmations are missing", !recorded);
    check("asks instead of supplying an answer", /\?[*_]*\s*$/m.test((r.texts ?? []).join("\n")));
    continue;
  }
  check("EMPATHY.md exists", Boolean(md), `found: [${paths.join(", ")}]`);
  if (!md) continue;
  for (const h of ["Needs", "Odd ones out", "Riskiest assumptions"]) check(`has ## ${h}`, new RegExp(`^## ${h}`, "mi").test(md));
  check("records attribution choice", /attribution/i.test(md));
  check("has a past-episode question", /the last time\b/i.test(md));
  const needs = needLines(md);
  check("every need is labelled", needs.length > 0 && needs.every((l) => LABEL.test(l)), needs.filter((l) => !LABEL.test(l)).join(" | "));

  if (["material", "privacy", "update", "ignored"].includes(r.case)) {
    const qs = quotes(section(md, "Needs") + section(md, "Their words") + section(md, "The job"));
    // A quote may be trimmed or elided ("…"), never reworded: each piece must appear verbatim.
    const pieces = (q) => norm(q).split(/\.\.\.|…|\[\.\.\.\]/).map((p) => p.trim().replace(/^[.,;:!?]+|[.,;:!?]+$/g, "").trim()).filter(Boolean);
    // The probe questions themselves ("When did you last see them do it?") are not evidence quotes.
    const isProbe = (q) => /\?$/.test(q.trim()) || /last seen|specifically|did they do instead/i.test(q);
    const missing = qs.filter((q) => !isProbe(q)).filter((q) => !pieces(q).every((p) => fixtureText.includes(p)));
    check("every quote appears verbatim in the material", qs.length > 0 && missing.length === 0, missing.length ? missing.join(" | ") : "no quotes found");
    check("outlier (deposit up front) under Odd ones out", /deposit/i.test(section(md, "Odd ones out")));
    check("dark-mode opinion kept out of ## Needs", !/dark mode/i.test(section(md, "Needs")));
    check("designer's belief stays assumed", !needs.some((l) => /faster invoicing/i.test(l) && !/\bassumed\b/i.test(l)));
  }
  if (["material", "privacy", "update", "ignored", "approve", "coach", "decline"].includes(r.case)) {
    const leaked = PEOPLE.filter((p) => new RegExp(`\\b${p.replace(/[.-]/g, "\\$&")}\\b`, "i").test(md));
    check("no names or emails from the material", leaked.length === 0, leaked.join(", "));
  }
  if (r.case === "nomaterial") {
    // Quoting the project's own README when saying no flow was found is not a claim about users.
    const withUrl = md.split("\n").filter((l) => quotes(l).length > 0 && !isQuestionLine(l) && !/readme|package\.json|no user-facing flow/i.test(l));
    if (withUrl.length === 0) {
      console.log("  note: no public quotes in the file");
      check("says plainly that no public quotes were confirmed", /no public quotes|could not confirm|couldn't confirm|none confirmed/i.test(md + r.final));
    } else {
      check("every evidence quote carries an https URL", withUrl.every((l) => /https:\/\//.test(l)), withUrl.filter((l) => !/https:\/\//.test(l)).join(" | "));
      const needQuoteLines = section(md, "Needs").split("\n").filter((l) => quotes(l).length > 0 && !isQuestionLine(l));
      check("needs built on public quotes are labelled public", needs.filter((l) => /https:\/\//.test(l) || needQuoteLines.length).every((l) => /\b(public|assumed)\b/i.test(l)));
    }
    console.log(`  spot-check these URLs by hand:\n    ${[...new Set(md.match(/https:\/\/[^\s)>"]+/g) ?? [])].slice(0, 6).join("\n    ")}`);
  }
  if (r.case === "noweb") {
    check("no URLs anywhere", !/https:\/\//.test(md));
    check("no public labels on needs", !needs.some((l) => /·\s*public\s*·/i.test(l)));
    check("every need assumed", needs.every((l) => /\bassumed\b/i.test(l)));
    check("says web search was unavailable", /web ?search[^.\n]*(not|n't|unavailable|denied|blocked)|no web/i.test(r.texts.join("\n") + r.final + md));
  }
  if (r.case === "coach" || r.case === "decline") {
    check("names the flow examined", /signup/i.test(md));
    const refs = [...section(md, "Assumptions in the code").matchAll(/(app\/[\w/.-]+\.tsx):(\d+)/g)];
    const real = refs.filter(([, f, n]) => {
      try { return Number(n) >= 1 && Number(n) <= readFileSync(join(here, "fixtures/flow", f), "utf8").split("\n").length; } catch { return false; }
    });
    check("## Assumptions in the code cites a real file:line", real.length > 0, refs.map((m) => m[0]).join(", ") || "none");
    check("explains a question with `Why I'm asking:`", /why i'm asking:/i.test(r.texts.join("\n")));
    const onboarding = md.split("\n").filter((l) => /onboarding|bank|five steps|5 steps/i.test(l));
    check("onboarding recollection labelled recalled", onboarding.some((l) => /\brecalled\b/i.test(l)));
    // The recollection (she quit at the bank step) can support or contradict the five-step assumption;
    // either way the status must say it rests on memory.
    check("onboarding status rests on recollection", /(supported|contradicted) by recollection/i.test(md));
    check("no code assumption marked plainly 'supported' on recollection alone",
      !section(md, "Assumptions in the code").split("\n").some((l) => /onboarding|bank|steps/i.test(l) && /\bsupported\b/i.test(l) && !/by recollection/i.test(l)));
  }
  if (r.case === "coach") {
    // Vague answers ×3 mean: status untested (never promoted), answer labelled assumed.
    const al = section(md, "Assumptions in the code").split("\n");
    const i = al.findIndex((l) => /phone|mobile/i.test(l));
    check("phone entry status stays untested", i >= 0 && /\buntested\b/i.test(al[i]) && !/\b(supported|contradicted)\b/i.test(al[i]), al[i] ?? "no phone entry");
    check("phone answer labelled assumed", i >= 0 && /\bassumed\b/i.test(al[i + 1] ?? ""), al[i + 1] ?? "");
  }
  if (r.case === "decline") check("nothing about the phone field recorded",
    !/\bphone (field|number)|mobile|\btel\b|reachable|app\/signup\/page\.tsx:(1[12]|2[56])\b/i.test(md));
  if (["coach", "decline", "material", "privacy", "update", "nocode", "approve", "ignored"].includes(r.case)) {
    // Confirm-first: the proposal list is shown before anything is written, even with a standing yes.
    check("shows a numbered list of what it proposes to record",
      // The heading in any form (bold or ##), then a numbered list within a few lines.
      /proposed for `?empathy\.md`?[^\n]*\n(?:[^\n]*\n){0,3}?\s*1[.)]\s/i.test((r.texts ?? []).join("\n")));
  }
  if (["material", "privacy", "update", "ignored", "approve", "coach", "decline"].includes(r.case)) {
    // Ticket senders give no role; one must not be guessed from their email domain.
    check("no role guessed from an email domain", !/film|creative agency|bello ?creative/i.test(md));
  }
  if (r.case === "nocode") {
    check("says no flow was found in code", /no (user-facing )?flow|no code|nothing built/i.test(md + r.final));
    check("asks the designer for their beliefs, with a Why line",
      /who[^?\n]*(for|have in mind|think|specifically)[^?\n]*\?/i.test((r.texts ?? []).join("\n")) && /why i'm asking:/i.test((r.texts ?? []).join("\n")));
  }
  if (r.case === "update") {
    const kept = /- Users want CSV export · assumed · isolated/.test(md);
    check("earlier entry kept as is, or its change was proposed first",
      kept || /csv[^\n]*\n?[^\n]*(propos|change|update)/i.test((r.texts ?? []).join("\n")));
  }
  if (r.case === "approve") {
    const tracked = (p) => { try { execFileSync("git", ["check-ignore", "-q", p], { cwd: r.dir }); return false; } catch { return true; } };
    check("saved to .dwic/EMPATHY.md", path === ".dwic/EMPATHY.md", path);
    check("git would track .dwic/EMPATHY.md", tracked(".dwic/EMPATHY.md"));
    check("rest of .dwic/ stays ignored", !tracked(".dwic/report.json"));
  }
  if (r.case === "ignored") {
    check("saved to docs/design-decisions/", path === "docs/design-decisions/EMPATHY.md", path);
    check("nothing written to ignored .dwic/", !paths.includes(".dwic/EMPATHY.md"));
  }
}
console.log(`\n${fails ? `${fails} FAIL` : "all PASS"}`);
process.exit(fails ? 1 : 0);
