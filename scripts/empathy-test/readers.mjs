// node scripts/empathy-test/readers.mjs <label> <pluginDir> [reps]
// Checks that ui-copywriter and form-designer use an existing EMPATHY.md, and still work without one.
import { spawn, execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, renameSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [label, pluginDir, repsArg] = process.argv.slice(2);
const reps = Number(repsArg ?? 1);
const here = new URL(".", import.meta.url).pathname;
const TOOLS = "Read,Glob,Grep,Edit,Write,Skill";

const CASES = [
  { id: "copy", withFile: true, prompt: "/design-with-claude:ui-copywriter Write the headline and subhead for the signup page in app/signup/page.tsx. Reply with the copy; don't edit files." },
  { id: "form", withFile: true, prompt: "/design-with-claude:form-designer People abandon the signup form in app/signup/page.tsx. Fix it." },
  { id: "form-nofile", withFile: false, prompt: "/design-with-claude:form-designer People abandon the signup form in app/signup/page.tsx. Fix it." },
];

function prepare(c) {
  const dir = mkdtempSync(join(tmpdir(), `readers-${c.id}-`));
  cpSync(join(here, "fixtures", "flow"), dir, { recursive: true });
  if (c.withFile) cpSync(join(here, "fixtures", "readers-extra"), dir, { recursive: true });
  if (existsSync(join(dir, "gitignore"))) renameSync(join(dir, "gitignore"), join(dir, ".gitignore"));
  if (existsSync(join(dir, "dwic"))) renameSync(join(dir, "dwic"), join(dir, ".dwic"));
  execFileSync("git", ["init", "-q"], { cwd: dir });
  return dir;
}

function run(c) {
  const dir = prepare(c);
  return new Promise((resolve) => {
    const child = spawn("claude", ["--setting-sources", "project", "-p", c.prompt, "--plugin-dir", pluginDir, "--strict-mcp-config",
      "--model", "sonnet", "--max-budget-usd", "1.50", "--allowedTools", TOOLS, "--output-format", "stream-json", "--verbose"],
      { cwd: dir, stdio: ["ignore", "pipe", "pipe"] });
    let buf = "";
    child.stdout.on("data", (d) => (buf += d));
    child.on("close", () => {
      const tools = [], texts = [];
      for (const line of buf.split("\n")) {
        try {
          const m = JSON.parse(line);
          if (m.type === "assistant") for (const b of m.message.content ?? []) {
            if (b.type === "tool_use") tools.push(`${b.name} ${JSON.stringify(b.input).slice(0, 160)}`);
            if (b.type === "text") texts.push(b.text);
          }
        } catch {}
      }
      resolve({ c, dir, tools, out: texts.join("\n"), signup: readFileSync(join(dir, "app/signup/page.tsx"), "utf8") });
    });
  });
}

let fails = 0;
const check = (name, ok, detail = "") => { if (!ok) fails++; console.log(`  ${ok ? "PASS" : "FAIL"} ${name}${!ok && detail ? ` — ${detail}` : ""}`); };
const results = await Promise.all(CASES.flatMap((c) => Array.from({ length: reps }, () => run(c))));
for (const r of results) {
  console.log(`\n${label} ${r.c.id}`);
  const readIt = r.tools.some((t) => /^Read\b.*EMPATHY\.md/.test(t));
  if (r.c.withFile) {
    check("read EMPATHY.md", readIt);
    check("says it used EMPATHY.md", /EMPATHY\.md/.test(r.out));
  }
  if (r.c.id === "copy") {
    check("uses the users' own words (chasing)", /chas/i.test(r.out));
    check("no invented testimonial", !/["“][^"”]{10,}["”]\s*[—–-]\s*[A-Z][a-z]+/.test(r.out));
  }
  if (r.c.id === "form") {
    check("flags the VAT field the evidence contradicts", /VAT/i.test(r.out) && /contradict|sole trader|threshold/i.test(r.out));
    check("does not delete the VAT field itself", /["']vat["']/.test(r.signup), // however the form is rewritten, the field keeps the name "vat"
      r.signup.split("\n").filter((l) => /vat/i.test(l)).join(" | ") || "no vat line left");
  }
  if (r.c.id === "form-nofile") {
    check("points to /design-empathy when there is no file", /design-empathy/i.test(r.out), r.out.slice(0, 300).replace(/\n/g, " "));
    check("still does the form work", /label|autocomplete|validation/i.test(r.out));
  }
}
console.log(`\n${fails ? `${fails} FAIL` : "all PASS"}`);
process.exit(fails ? 1 : 0);
