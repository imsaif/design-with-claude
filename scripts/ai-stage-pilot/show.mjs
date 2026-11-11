import { readdirSync, readFileSync } from "node:fs";
const dir = new URL("./results/", import.meta.url).pathname;
const prefix = process.argv[2] ?? "before";
const max = Number(process.argv[3] ?? 1800);
for (const f of readdirSync(dir).filter((f) => f.startsWith(prefix)).sort()) {
  const r = JSON.parse(readFileSync(dir + f, "utf8"));
  console.log(`\n=== ${f}\ntools:\n  ${r.tools.map((t) => t.slice(0, 100)).join("\n  ")}\nchanged: ${r.changed.join(", ")}`);
  for (const [k, v] of Object.entries(r.after)) console.log(`--- ${k}\n${v.slice(0, 1200)}`);
  console.log(`--- final\n${r.final.slice(0, max)}`);
}
