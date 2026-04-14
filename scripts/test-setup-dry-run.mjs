#!/usr/bin/env node
// Exercise bin/setup.js in project scope against a tmp directory.
import { mkdtempSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const setupBin = resolve(here, "..", "dist", "bin", "setup.js");

const tmp = mkdtempSync(join(tmpdir(), "dwc-setup-test-"));
console.log(`→ tmp project: ${tmp}`);

const setup = spawnSync(
  process.execPath,
  [
    setupBin,
    "setup",
    "--token=imr_testtoken",
    "--project=smoke-test",
    "--scope=project",
    "--skip-validate",
    "--api=http://127.0.0.1:1",
  ],
  { cwd: tmp, encoding: "utf8" },
);
console.log(setup.stdout);
if (setup.status !== 0) {
  console.error("setup exit " + setup.status);
  console.error(setup.stderr);
  process.exitCode = 1;
}

const mcpPath = join(tmp, ".mcp.json");
if (!existsSync(mcpPath)) {
  console.error("FAIL: .mcp.json not written");
  process.exitCode = 1;
} else {
  const cfg = JSON.parse(readFileSync(mcpPath, "utf8"));
  const entry = cfg.mcpServers?.designwithclaude;
  if (!entry || entry.env?.DWC_TOKEN !== "imr_testtoken") {
    console.error("FAIL: mcp entry malformed", JSON.stringify(cfg, null, 2));
    process.exitCode = 1;
  } else if (entry.env?.DWC_PROJECT_ID !== "smoke-test") {
    console.error("FAIL: DWC_PROJECT_ID missing/wrong", JSON.stringify(entry.env, null, 2));
    process.exitCode = 1;
  } else {
    console.log("✔ .mcp.json written with DWC_TOKEN + DWC_PROJECT_ID env");
  }
}

const uninstall = spawnSync(
  process.execPath,
  [setupBin, "uninstall", "--scope=project"],
  { cwd: tmp, encoding: "utf8" },
);
console.log(uninstall.stdout);

const after = existsSync(mcpPath)
  ? JSON.parse(readFileSync(mcpPath, "utf8"))
  : {};
if (after.mcpServers?.designwithclaude) {
  console.error("FAIL: designwithclaude still present after uninstall");
  process.exitCode = 1;
} else {
  console.log("✔ uninstall removed designwithclaude entry");
}

rmSync(tmp, { recursive: true, force: true });
if (!process.exitCode) console.log("\nALL GOOD — setup dry-run works.");
