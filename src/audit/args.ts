// Argv parser for `dwic audit`. Keeps the flag surface small — auto-detect
// should be the default experience; overrides are escape hatches.

export interface AuditArgs {
  cwd: string;
  telemetry: boolean;
  maxFiles: number;
  cssOverrides: string[];
  markupOverrides: string[];
  help: boolean;
  json: boolean;
}

const DEFAULT_MAX_FILES = 200;

export function parseAuditArgs(argv: string[]): AuditArgs {
  // argv = [node, script, "audit", ...rest]
  const rest = argv.slice(3);
  const args: AuditArgs = {
    cwd: process.cwd(),
    telemetry: true,
    maxFiles: DEFAULT_MAX_FILES,
    cssOverrides: [],
    markupOverrides: [],
    help: false,
    json: false,
  };
  for (const raw of rest) {
    if (raw === "--help" || raw === "-h") args.help = true;
    else if (raw === "--no-telemetry") args.telemetry = false;
    else if (raw === "--json") args.json = true;
    else if (raw.startsWith("--cwd=")) args.cwd = raw.slice("--cwd=".length);
    else if (raw.startsWith("--max-files=")) {
      const n = Number(raw.slice("--max-files=".length));
      if (Number.isFinite(n) && n > 0) args.maxFiles = Math.floor(n);
    } else if (raw.startsWith("--css=")) {
      args.cssOverrides.push(raw.slice("--css=".length));
    } else if (raw.startsWith("--markup=")) {
      args.markupOverrides.push(raw.slice("--markup=".length));
    }
  }
  // Env-based opt-out stacks on top of the flag.
  if (process.env.DWIC_TELEMETRY?.trim() === "off") args.telemetry = false;
  return args;
}

export function renderAuditHelp(): string {
  return [
    "dwic audit — scan a project for design-system gaps",
    "",
    "Usage:",
    "  npx @imrandwc/dwic audit [options]",
    "",
    "Options:",
    "  --cwd=<path>        Project root to scan (default: cwd)",
    "  --css=<path>        Additional CSS file to include (repeatable)",
    "  --markup=<path>     Additional HTML/JSX/TSX file to include (repeatable)",
    "  --max-files=<N>     Cap markup files scanned (default: 200)",
    "  --no-telemetry      Disable the anonymous audit-run ping",
    "  --json              Print machine-readable JSON instead of the dashboard",
    "  -h, --help          Show this help",
    "",
    "Exit codes: 0 = clean · 1 = warnings present · 2 = errors present",
    "",
    "Learn more: https://designwithclaude.com",
  ].join("\n");
}
