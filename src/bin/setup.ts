#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const VERSION = "2.0.0-alpha.3";
const DEFAULT_API = "https://designwithclaude.com";
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,31}$/;

type Scope = "user" | "project";
type Args = {
  command: "setup" | "uninstall" | "help" | "version";
  token?: string;
  project?: string;
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
    // Project-scope is the new default — keeps multi-project installs clean.
    scope: "project",
    apiUrl: DEFAULT_API,
    skipValidate: false,
    cwd: process.cwd(),
  };
  for (const arg of rest) {
    if (arg.startsWith("--token=")) args.token = arg.slice("--token=".length);
    else if (arg.startsWith("--project=")) args.project = arg.slice("--project=".length);
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
    "  npx designwithclaude setup --token=imr_xxx --project=<slug>",
    "  npx designwithclaude uninstall [--project=<slug>] [--scope=project|user]",
    "",
    "Options:",
    "  --token=imr_xxx      Your dwc token (from designwithclaude.com onboarding)",
    "  --project=<slug>     Project slug — one per real project. Examples: thriya, acme-landing",
    "                       (lowercase, digits, hyphens — a–z 0–9, 2–32 chars starting with a letter or digit)",
    "  --scope=project      Writes .mcp.json in the current dir (default, recommended)",
    "  --scope=user         Writes ~/.claude.json — binds this project to every cwd (rarely what you want)",
    "  --api=<url>          Override dwc API base URL (defaults to " + DEFAULT_API + ")",
    "  --skip-validate      Skip online token validation (dev)",
    "",
    "Examples:",
    "  npx designwithclaude setup --token=imr_a7f3x92k --project=thriya",
    "  npx designwithclaude setup --token=imr_a7f3x92k --project=acme-landing",
    "  npx designwithclaude uninstall --project=thriya",
    "",
    "Learn more: https://designwithclaude.com",
  ].join("\n");
  process.stdout.write(help + "\n");
}

function printVersion(): void {
  process.stdout.write(`designwithclaude v${VERSION}\n`);
}

async function validateToken(
  token: string,
  apiUrl: string,
  project: string | undefined,
): Promise<{ ok: boolean; reason?: string; projectKnown?: boolean }> {
  const url = `${apiUrl.replace(/\/$/, "")}/api/tokens/validate`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, project }),
      signal: AbortSignal.timeout(5000),
    });
    if (res.status === 404) {
      return { ok: true, reason: "api-404-alpha-ok" };
    }
    if (!res.ok) {
      return { ok: false, reason: `validation ${res.status}` };
    }
    const body = (await res.json()) as { valid?: boolean; projectKnown?: boolean };
    return { ok: body?.valid !== false, projectKnown: body?.projectKnown };
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

function buildMcpEntry(serverPath: string, token: string, apiUrl: string, project: string) {
  return {
    type: "stdio" as const,
    command: "node",
    args: [serverPath],
    env: {
      DWC_TOKEN: token,
      DWC_PROJECT_ID: project,
      DWC_API_URL: apiUrl,
      DWC_GATING: "on",
    },
  };
}

/** Key in mcpServers — namespaced per project for user-scope installs so two
 *  user-scope projects don't collide; plain name for project-scope. */
function mcpServerKey(scope: Scope, project: string): string {
  return scope === "user" ? `designwithclaude-${project}` : "designwithclaude";
}

function writeUserConfig(entry: ReturnType<typeof buildMcpEntry>, key: string): string {
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
  servers[key] = entry;
  json.mcpServers = servers;
  writeFileSync(path, JSON.stringify(json, null, 2) + "\n");
  return path;
}

function writeProjectConfig(
  cwd: string,
  entry: ReturnType<typeof buildMcpEntry>,
  key: string,
): string {
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
  servers[key] = entry;
  json.mcpServers = servers;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(json, null, 2) + "\n");
  return path;
}

function removeUserConfig(key: string): string | null {
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
  if (!servers || !(key in servers)) return null;
  delete servers[key];
  json.mcpServers = servers;
  writeFileSync(path, JSON.stringify(json, null, 2) + "\n");
  return path;
}

function removeProjectConfig(cwd: string, key: string): string | null {
  const path = join(cwd, ".mcp.json");
  if (!existsSync(path)) return null;
  try {
    const json = JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
    const servers = json.mcpServers as Record<string, unknown> | undefined;
    if (!servers || !(key in servers)) return null;
    delete servers[key];
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
  key: string,
): Promise<boolean> {
  const res = spawnSync(
    "claude",
    ["mcp", "add-json", key, JSON.stringify(entry), "--scope", scope],
    { stdio: "ignore" },
  );
  return res.status === 0;
}

async function emitConnectedEvent(
  apiUrl: string,
  token: string,
  project: string,
): Promise<void> {
  try {
    await fetch(`${apiUrl.replace(/\/$/, "")}/api/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        project,
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
    process.stderr.write(
      red("Missing --token. ") +
        "Run " +
        bold("npx designwithclaude setup --token=imr_xxx --project=<slug>") +
        "\n",
    );
    process.exitCode = 1;
    return;
  }
  if (!args.project) {
    process.stderr.write(
      red("Missing --project. ") +
        "Add " +
        bold("--project=<slug>") +
        " so dwc knows which design system this Claude Code project belongs to.\n" +
        dim("  Examples: --project=thriya, --project=acme-landing\n"),
    );
    process.exitCode = 1;
    return;
  }
  if (!SLUG_PATTERN.test(args.project)) {
    process.stderr.write(
      red("Invalid --project slug: ") +
        `"${args.project}". ` +
        dim("Lowercase letters + digits + hyphens, 2–32 chars, starting with a letter or digit.\n"),
    );
    process.exitCode = 1;
    return;
  }

  process.stdout.write(`${bold("designwithclaude")} ${dim("v" + VERSION)}\n\n`);

  if (args.scope === "user") {
    process.stdout.write(
      yellow(
        "  ⚠ user-scope install binds this project to every cwd. Prefer --scope=project unless you know why you want this.\n",
      ),
    );
  }

  if (!args.skipValidate) {
    process.stdout.write(dim("→ validating token…\n"));
    const v = await validateToken(args.token, args.apiUrl, args.project);
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
      const projectNote =
        v.projectKnown === true
          ? `  ${dim("(project already exists on this token)")}`
          : v.projectKnown === false
            ? `  ${dim("(new project — we'll create it on your next tool call)")}`
            : "";
      process.stdout.write(green("  ✔ token accepted") + projectNote + "\n");
    }
  }

  const serverPath = resolveServerPath();
  const entry = buildMcpEntry(serverPath, args.token, args.apiUrl, args.project);
  const key = mcpServerKey(args.scope, args.project);

  let writtenAt: string;
  let usedCli = false;

  if (args.scope === "user") {
    usedCli = await tryUsingClaudeCli(entry, "user", key);
    if (usedCli) {
      writtenAt = `~/.claude.json (via \`claude mcp add-json ${key}\`)`;
    } else {
      writtenAt = writeUserConfig(entry, key);
    }
  } else {
    writtenAt = writeProjectConfig(args.cwd, entry, key);
  }

  process.stdout.write(
    green(`  ✔ registered project "${args.project}"`) + dim(` → ${writtenAt}\n`),
  );

  await emitConnectedEvent(args.apiUrl, args.token, args.project);

  const companionUrl = `${args.apiUrl.replace(/\/$/, "")}/companion?token=${args.token}&project=${args.project}`;

  process.stdout.write(
    "\n" +
      bold("Next: ") +
      "start a new Claude Code session in this directory and try:\n" +
      dim("    ") +
      "Use the hello-world tool from designwithclaude\n\n" +
      dim("Then: ") +
      "open " +
      companionUrl +
      " to watch your work render live.\n",
  );
}

async function runUninstall(args: Args): Promise<void> {
  // With --project: remove just that entry.
  // Without: remove any/all designwithclaude* entries in the chosen scope.
  const projectSlug = args.project?.trim();
  if (projectSlug && !SLUG_PATTERN.test(projectSlug)) {
    process.stderr.write(red(`Invalid --project slug: "${projectSlug}".\n`));
    process.exitCode = 1;
    return;
  }

  if (args.scope === "user") {
    const key = projectSlug ? `designwithclaude-${projectSlug}` : "designwithclaude";
    const removedCli = spawnSync(
      "claude",
      ["mcp", "remove", key, "--scope", "user"],
      { stdio: "ignore" },
    );
    if (removedCli.status === 0) {
      process.stdout.write(green(`✔ removed ${key} from user scope (via claude CLI)\n`));
      return;
    }
    const path = removeUserConfig(key);
    if (path) {
      process.stdout.write(green(`✔ removed ${key} from ${path}\n`));
    } else {
      process.stdout.write(dim(`(no ${key} entry in user scope)\n`));
    }
  } else {
    // project-scope: entry is always keyed 'designwithclaude' in .mcp.json
    const path = removeProjectConfig(args.cwd, "designwithclaude");
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
