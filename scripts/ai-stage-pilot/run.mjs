// node scripts/ai-stage-pilot/run.mjs <label> <pluginDir> [reps]
// Runs the three pilot commands on fresh copies of their fixtures and saves what each run said and did
// to results/<label>-<case>-<n>.json. `node scripts/ai-stage-pilot/show.mjs <label>` prints them.
// Compare a label run against main's copy of the plugin with one run against a branch.
// What "worked" means, per case: critic gives no ship verdict and ends with "## Your call";
// form keeps every field and invents no claims; debug edits the file and reruns it.
import { spawn } from "node:child_process";
import { cpSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [label, pluginDir, repsArg] = process.argv.slice(2);
const reps = Number(repsArg ?? 2);
const here = new URL(".", import.meta.url).pathname;
const out = join(here, "results");
mkdirSync(out, { recursive: true });

const cases = [
  { id: "critic", fixture: "critic", tools: "Read,Glob,Grep,Skill",
    prompt: "/design-with-claude:design-critic Is the Signup component in src/components good enough to ship this week?" },
  { id: "form", fixture: "form", tools: "Read,Glob,Grep,Edit,Write,Skill",
    prompt: "/design-with-claude:form-designer People are abandoning the trial signup form in src/TrialSignup.tsx. Fix it." },
  { id: "debug", fixture: "debug", tools: "Read,Glob,Grep,Edit,Write,Bash(node:*),Skill",
    prompt: "/design-with-claude:debug-helper Running `node src/report.js` crashes with: TypeError: Cannot read properties of undefined (reading 'map')" },
];

const files = (dir) => Object.fromEntries(readdirSync(join(dir, "src"), { recursive: true })
  .filter((f) => /\.(tsx|js|json)$/.test(f)).map((f) => [f, readFileSync(join(dir, "src", f), "utf8")]));

function run(c, n) {
  const dir = mkdtempSync(join(tmpdir(), `pilot-${c.id}-`));
  cpSync(join(here, "fixtures", c.fixture), dir, { recursive: true });
  const before = files(dir);
  return new Promise((resolve) => {
    const child = spawn("claude", ["--setting-sources", "project", "-p", c.prompt, "--plugin-dir", pluginDir,
      "--strict-mcp-config", "--model", "sonnet", "--max-budget-usd", "1.00", "--allowedTools", c.tools,
      "--output-format", "stream-json", "--verbose"], { cwd: dir, stdio: ["ignore", "pipe", "pipe"] });
    let buf = "";
    child.stdout.on("data", (d) => (buf += d));
    child.on("close", () => {
      const tools = [], texts = [];
      let result = "";
      for (const line of buf.split("\n")) {
        try {
          const m = JSON.parse(line);
          if (m.type === "assistant") for (const b of m.message.content ?? []) {
            if (b.type === "tool_use") tools.push(`${b.name} ${JSON.stringify(b.input).slice(0, 160)}`);
            if (b.type === "text") texts.push(b.text);
          }
          if (m.type === "result") result = m.result ?? "";
        } catch {}
      }
      const after = files(dir);
      const changed = Object.keys(after).filter((f) => after[f] !== before[f]);
      const rec = { label, case: c.id, n, tools, changed, after: Object.fromEntries(changed.map((f) => [f, after[f]])), final: result || texts.at(-1) || "" };
      writeFileSync(join(out, `${label}-${c.id}-${n}.json`), JSON.stringify(rec, null, 2));
      console.log(`${label} ${c.id} #${n}: ${tools.length} tool calls, changed [${changed.join(", ")}]`);
      resolve();
    });
  });
}

await Promise.all(cases.flatMap((c) => Array.from({ length: reps }, (_, i) => run(c, i + 1))));
