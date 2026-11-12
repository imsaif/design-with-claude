// node scripts/empathy-test/run.mjs <label> <pluginDir> [reps] [case,case]
// Runs /design-empathy headless on fresh copies of the fixtures and saves every EMPATHY.md each run
// wrote to results/<label>-<case>-<n>.json. `node scripts/empathy-test/check.mjs <label>` grades them.
// Fixtures keep `gitignore` and `dwic/` un-dotted so this repo's own ignore rules don't swallow them;
// they are renamed to `.gitignore` and `.dwic/` in each run's copy.
import { spawn, execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, appendFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [label, pluginDir, repsArg, only] = process.argv.slice(2);
if (!label || !pluginDir) {
  console.error("usage: run.mjs <label> <pluginDir> [reps] [case,case]");
  process.exit(2);
}
const reps = Number(repsArg ?? 1);
const here = new URL(".", import.meta.url).pathname;
const out = join(here, "results");
mkdirSync(out, { recursive: true });

const BASE_TOOLS = "Read,Glob,Grep,Write,Edit,Bash(git:*),Bash(ls:*),Bash(mkdir:*),Skill";
const WEB_TOOLS = `${BASE_TOOLS},WebSearch,WebFetch,Agent`;
const MATERIAL = "Material is in research/. Attribution: remove names and emails, keep role, source type and date. My current belief: freelancers mostly want faster invoicing.";

// Revision 2: the designer's probe answers and confirmations travel in the prompt, since -p is one message.
const COACH = "Look at the signup flow: app/signup and the onboarding it leads to. Make sure the required phone field and the five onboarding steps are among what you probe. My answers to your probes, in order — about the phone field: 'users want to be reachable', then 'people in general, I suppose', then 'I don't really know'. About the onboarding steps: 'A freelance photographer I demoed to on 3 November quit at the connect-your-bank step and said she would finish later; she never came back.' About anything else you probe: 'no idea yet'. Material is in research/. Attribution: remove names and emails, keep role, source type and date. Approve any .gitignore change you need.";

export const CASES = [
  { id: "coach", fixtures: ["material", "flow"], tools: BASE_TOOLS, prompt: `${COACH} Confirm: yes to everything you propose recording.` },
  { id: "decline", fixtures: ["material", "flow"], tools: BASE_TOOLS, prompt: `${COACH} Confirm: yes to everything you propose recording, except anything about the phone field: do not record that at all.` },
  { id: "nocode", fixtures: ["nomaterial"], tools: BASE_TOOLS, prompt: "Look at the signup flow. I have no user material. Attribution: full source as given. My current belief: freelancers hate chasing late payments. Confirm: yes to everything you propose recording. Approve any .gitignore change you need." },
  { id: "material", fixtures: ["material"], tools: BASE_TOOLS, prompt: `${MATERIAL} Approve any .gitignore change you need.` },
  { id: "privacy", fixtures: ["material"], tools: BASE_TOOLS, prompt: `${MATERIAL} Approve any .gitignore change you need.` },
  { id: "nomaterial", fixtures: ["nomaterial"], tools: WEB_TOOLS, prompt: "I have no user material at all. Competitors I know of: FreshBooks, Wave, Bonsai. Attribution: full source as given. My current belief: freelancers hate chasing late payments. Approve any .gitignore change you need." },
  { id: "noweb", fixtures: ["nomaterial"], tools: BASE_TOOLS, prompt: "I have no user material at all. Competitors I know of: FreshBooks, Wave, Bonsai. Attribution: full source as given. My current belief: freelancers hate chasing late payments. Approve any .gitignore change you need." },
  { id: "update", fixtures: ["material", "update-extra"], tools: BASE_TOOLS, prompt: `${MATERIAL} Approve any .gitignore change you need.` },
  { id: "ignored", fixtures: ["material"], ignoreDwic: true, tools: BASE_TOOLS, prompt: `${MATERIAL} Do not change .gitignore.` },
  { id: "approve", fixtures: ["material"], ignoreDwic: true, tools: BASE_TOOLS, prompt: `${MATERIAL} Yes, change .gitignore so EMPATHY.md is saved, but keep the rest of .dwic/ ignored.` },
];

function findEmpathy(dir, rel = "") {
  const found = {};
  for (const e of readdirSync(join(dir, rel), { withFileTypes: true })) {
    if (e.name === ".git" || e.name === "node_modules") continue;
    const p = join(rel, e.name);
    if (e.isDirectory()) Object.assign(found, findEmpathy(dir, p));
    else if (e.name === "EMPATHY.md") found[p] = readFileSync(join(dir, p), "utf8");
  }
  return found;
}

function prepare(c) {
  const dir = mkdtempSync(join(tmpdir(), `empathy-${c.id}-`));
  for (const f of c.fixtures) cpSync(join(here, "fixtures", f), dir, { recursive: true });
  if (existsSync(join(dir, "gitignore"))) renameSync(join(dir, "gitignore"), join(dir, ".gitignore"));
  if (existsSync(join(dir, "dwic"))) renameSync(join(dir, "dwic"), join(dir, ".dwic"));
  if (c.ignoreDwic) appendFileSync(join(dir, ".gitignore"), ".dwic/\n");
  execFileSync("git", ["init", "-q"], { cwd: dir });
  return dir;
}

function run(c, n) {
  const dir = prepare(c);
  return new Promise((resolve) => {
    const child = spawn("claude", ["--setting-sources", "project", "-p", `/design-with-claude:design-empathy ${c.prompt}`,
      "--plugin-dir", pluginDir, "--strict-mcp-config", "--model", "sonnet", "--max-budget-usd", "2.00",
      "--allowedTools", c.tools, "--output-format", "stream-json", "--verbose"], { cwd: dir, stdio: ["ignore", "pipe", "pipe"] });
    let buf = "";
    child.stdout.on("data", (d) => (buf += d));
    child.on("close", () => {
      const tools = [], texts = [];
      let final = "";
      for (const line of buf.split("\n")) {
        try {
          const m = JSON.parse(line);
          if (m.type === "assistant") for (const b of m.message.content ?? []) {
            if (b.type === "tool_use") tools.push(`${b.name} ${JSON.stringify(b.input).slice(0, 160)}`);
            if (b.type === "text") texts.push(b.text);
          }
          if (m.type === "result") final = m.result ?? "";
        } catch {}
      }
      const rec = { case: c.id, n, dir, tools, texts, files: findEmpathy(dir), final: final || texts.at(-1) || "" };
      writeFileSync(join(out, `${label}-${c.id}-${n}.json`), JSON.stringify(rec, null, 2));
      console.log(`${label} ${c.id} #${n}: ${tools.length} tool calls, EMPATHY.md at [${Object.keys(rec.files).join(", ")}]`);
      resolve();
    });
  });
}

const picked = only ? CASES.filter((c) => only.split(",").includes(c.id)) : CASES;
await Promise.all(picked.flatMap((c) => Array.from({ length: reps }, (_, i) => run(c, i + 1))));
