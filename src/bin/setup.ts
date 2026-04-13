#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const VERSION = "2.0.0-alpha.1";
const DEFAULT_API = "https://designwithclaude.com";

type Scope = "user" | "project";
type Args = {
  command: "setup" | "uninstall" | "help" | "version";
  token?: string;
  scope: Scope;
  apiUrl: string;
  skipValidate: boolean;
  cwd: string;
};

function parseArgs(argv: string[]): Args {
  const [, , rawCommand, ...rest] = argv;
  const command = (rawCommand ?? "help") as Args["command"];
  const args: Args = {
    command: ["setup", "uninstall", "help", "version"].includes(command)
      ? command
      : "help",
    scope: "user",
    apiUrl: DEFAULT_API,
    skipValidate: false,
    cwd: process.cwd(),
  };
  for (const arg of rest) {
    if (arg.startsWith("--token=")) args.token = arg.slice("--token=".length);
    else if (arg === "--scope=user") args.scope = "user";
    else if (arg === "--scope=project") args.scope = "project";
    else if (arg.startsWith("--api=")) args.apiUrl = arg.slice("--api=".length);
    else if (arg === "--skip-validate") args.skipValidate = true;
    else if (arg === "--dev") args.skipValidate = true;
  }
  return args;
}

function bold(s: string) {
  return `\x1b[1m${s}\x1b[0m`;
}
function dim(s: string) {
  return `\x1b[2m${s}\x1b[0m`;
}
function green(s: string) {
  return `\x1b[32m${s}\x1b[0m`;
}
function red(s: string) {
  return `\x1b[31m${s}\x1b[0m`;
}
function yellow(s: string) {
  return `\x1b[33m${s}\x1b[0m`;
}

function printHelp(): void {
  const help = [
    bold("designwithclaude") + ` v${VERSION}`,
    "",
    "Usage:",
    "  npx designwithclaude setup --token=imr_xxx [--scope=user|project]",
    "  npx designwithclaude uninstall [--scope=user|project]",
    "",
    "Options:",
    "  --token=imr_xxx      Your dwc token (from designwithclaude.com onboarding)",
    "  --scope=user         Register for all Claude Code sessions (default)",
    "  --scope=project      Register only for the current directory (writes .mcp.json)",
    "  --api=<url>          Override dwc API base URL (defaults to " + DEFAULT_API + ")",
    "  --skip-validate      Skip online token validation (dev)",
    "",
    "Examples:",
    "  npx designwithclaude setup --token=imr_a7f3x92k",
    "  npx designwithclaude setup --token=imr_a7f3x92k --scope=project",
    "  npx designwithclaude uninstall --scope=user",
    "",
    "Learn more: https://designwithclaude.com",
  ].join("\n");
  process.stdout.write(help + "\n");
}

function printVersion(): void {
  process.stdout.write(`designwithclaude v${VERSION}\n`);
}

async function validateToken(token: string, apiUrl: string): Promise<{ ok: boolean; reason?: string }> {
  const url = `${apiUrl.replace(/\/$/, "")}/api/tokens/validate`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
      signal: AbortSignal.timeout(5000),
    });
    if (res.status === 404) {
      return { ok: true, reason: "api-404-alpha-ok" };
    }
    if (!res.ok) {
      return { ok: false, reason: `validation ${res.status}` };
    }
    const body = (await res.json()) as { valid?: boolean };
    return { ok: body?.valid !== false };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) };
  }
}

function resolveServerPath(): string {
  const thisFile = fileURLToPath(import.meta.url);
  const candidate = resolve(dirname(thisFile), "..", "server.js");
  if (!existsSync(candidate)) {
    throw new Error(
      `Could not locate dist/server.js (looked at ${candidate}). Was the package built?`,
    );
  }
  return candidate;
}

function buildMcpEntry(serverPath: string, token: string, apiUrl: string) {
  return {
    type: "stdio" as const,
    command: "node",
    args: [serverPath],
    env: {
      DWC_TOKEN: token,
      DWC_API_URL: apiUrl,
      DWC_GATING: "on",
    },
  };
}

function writeUserConfig(entry: ReturnType<typeof buildMcpEntry>): string {
  const path = join(homedir(), ".claude.json");
  let json: Record<string, unknown> = {};
  if (existsSync(path)) {
    const backup = `${path}.dwc-backup-${Date.now()}`;
    copyFileSync(path, backup);
    try {
      json = JSON.parse(readFileSync(path, "utf8"));
    } catch (err) {
      throw new Error(
        `~/.claude.json is not valid JSON — aborting. Backup at ${backup}. (${err instanceof Error ? err.message : String(err)})`,
      );
    }
  }
  const servers = (json.mcpServers as Record<string, unknown>) ?? {};
  servers["designwithclaude"] = entry;
  json.mcpServers = servers;
  writeFileSync(path, JSON.stringify(json, null, 2) + "\n");
  return path;
}

function writeProjectConfig(cwd: string, entry: ReturnType<typeof buildMcpEntry>): string {
  const path = join(cwd, ".mcp.json");
  let json: Record<string, unknown> = {};
  if (existsSync(path)) {
    try {
      json = JSON.parse(readFileSync(path, "utf8"));
    } catch {
      json = {};
    }
  }
  const servers = (json.mcpServers as Record<string, unknown>) ?? {};
  servers["designwithclaude"] = entry;
  json.mcpServers = servers;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(json, null, 2) + "\n");
  return path;
}

function removeUserConfig(): string | null {
  const path = join(homedir(), ".claude.json");
  if (!existsSync(path)) return null;
  const raw = readFileSync(path, "utf8");
  let json: Record<string, unknown>;
  try {
    json = JSON.parse(raw);
  } catch {
    return null;
  }
  const servers = json.mcpServers as Record<string, unknown> | undefined;
  if (!servers || !("designwithclaude" in servers)) return null;
  delete servers["designwithclaude"];
  json.mcpServers = servers;
  writeFileSync(path, JSON.stringify(json, null, 2) + "\n");
  return path;
}

function removeProjectConfig(cwd: string): string | null {
  const path = join(cwd, ".mcp.json");
  if (!existsSync(path)) return null;
  try {
    const json = JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
    const servers = json.mcpServers as Record<string, unknown> | undefined;
    if (!servers || !("designwithclaude" in servers)) return null;
    delete servers["designwithclaude"];
    if (Object.keys(servers).length === 0) {
      delete json.mcpServers;
    } else {
      json.mcpServers = servers;
    }
    writeFileSync(path, JSON.stringify(json, null, 2) + "\n");
    return path;
  } catch {
    return null;
  }
}

async function tryUsingClaudeCli(
  entry: ReturnType<typeof buildMcpEntry>,
  scope: Scope,
): Promise<boolean> {
  const res = spawnSync(
    "claude",
    [
      "mcp",
      "add-json",
      "designwithclaude",
      JSON.stringify(entry),
      "--scope",
      scope,
    ],
    { stdio: "ignore" },
  );
  return res.status === 0;
}

async function emitConnectedEvent(apiUrl: string, token: string): Promise<void> {
  try {
    await fetch(`${apiUrl.replace(/\/$/, "")}/api/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        toolName: "__mcp.connected__",
        input: {},
        output: { version: VERSION, channel: "setup.ts" },
        timestamp: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(4000),
    });
  } catch {
    /* best effort */
  }
}

async function runSetup(args: Args): Promise<void> {
  if (!args.token) {
    process.stderr.write(red("Missing --token. ") + "Run " + bold("npx designwithclaude setup --token=imr_xxx") + "\n");
    process.exitCode = 1;
    return;
  }

  process.stdout.write(`${bold("designwithclaude")} ${dim("v" + VERSION)}\n\n`);

  if (!args.skipValidate) {
    process.stdout.write(dim("→ validating token…\n"));
    const v = await validateToken(args.token, args.apiUrl);
    if (!v.ok) {
      process.stdout.write(
        yellow(
          `  ⚠ could not validate token (${v.reason}). Continuing local install; the server will retry on first tool call.\n`,
        ),
      );
    } else if (v.reason === "api-404-alpha-ok") {
      process.stdout.write(
        dim("  (dwc API not live yet — local install only for alpha)\n"),
      );
    } else {
      process.stdout.write(green("  ✔ token accepted\n"));
    }
  }

  const serverPath = resolveServerPath();
  const entry = buildMcpEntry(serverPath, args.token, args.apiUrl);

  let writtenAt: string;
  let usedCli = false;

  if (args.scope === "user") {
    usedCli = await tryUsingClaudeCli(entry, "user");
    if (usedCli) {
      writtenAt = "~/.claude.json (via `claude mcp add-json`)";
    } else {
      writtenAt = writeUserConfig(entry);
    }
  } else {
    writtenAt = writeProjectConfig(args.cwd, entry);
  }

  process.stdout.write(green(`  ✔ MCP server registered`) + dim(` → ${writtenAt}\n`));

  await emitConnectedEvent(args.apiUrl, args.token);

  process.stdout.write(
    "\n" +
      bold("Next: ") +
      "start a new Claude Code session and try:\n" +
      dim("    ") +
      "Use the hello-world tool from designwithclaude\n\n" +
      dim("Then: ") +
      "open https://designwithclaude.com/companion to watch your work render live.\n",
  );
}

async function runUninstall(args: Args): Promise<void> {
  if (args.scope === "user") {
    const removedCli = spawnSync(
      "claude",
      ["mcp", "remove", "designwithclaude", "--scope", "user"],
      { stdio: "ignore" },
    );
    if (removedCli.status === 0) {
      process.stdout.write(green("✔ removed from user scope (via claude CLI)\n"));
      return;
    }
    const path = removeUserConfig();
    if (path) {
      process.stdout.write(green(`✔ removed from ${path}\n`));
    } else {
      process.stdout.write(dim("(nothing to remove at user scope)\n"));
    }
  } else {
    const path = removeProjectConfig(args.cwd);
    if (path) {
      process.stdout.write(green(`✔ removed from ${path}\n`));
    } else {
      process.stdout.write(dim("(no project-scoped config found)\n"));
    }
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  switch (args.command) {
    case "help":
      printHelp();
      break;
    case "version":
      printVersion();
      break;
    case "setup":
      await runSetup(args);
      break;
    case "uninstall":
      await runUninstall(args);
      break;
  }
}

main().catch((err) => {
  process.stderr.write(red("fatal: ") + (err instanceof Error ? err.message : String(err)) + "\n");
  process.exit(1);
});
