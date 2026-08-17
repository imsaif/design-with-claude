#!/usr/bin/env node
// Entry point for `dwic audit`. The `dwic` setup CLI dispatches here when
// argv[2] === "audit". Also runnable directly: `node dist/bin/audit.js audit`.

import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve as resolvePath } from "node:path";
import { parseAuditArgs, renderAuditHelp } from "../audit/args.js";
import { walkProject } from "../audit/walker.js";
import { aggregate, exitCodeFromSeverity, worstOverall, type CategoryResult } from "../audit/aggregator.js";
import { renderDashboard, renderJson } from "../audit/dashboard.js";
import { writeMarkdownReport } from "../audit/markdown-report.js";
import { detectProjectConfig } from "../utils/detect-project-config.js";
import { emitAuditTelemetry, maybePrintFirstRunNotice } from "../audit/telemetry.js";
import { buildBaselineFile, diff, parseBaselineFile, type BaselineFile, type DriftReport } from "../audit/drift.js";
import { startWatcher } from "../audit/watcher.js";

const CLI_VERSION = "1.0.0-alpha.10";
const DEFAULT_BASELINE_REL = ".dwic/baseline.json";

interface AuditPass {
  results: CategoryResult[];
  drift: DriftReport | null;
  detected: ReturnType<typeof detectProjectConfig>;
  inputs: ReturnType<typeof walkProject>;
}

function runOnePass(
  cwd: string,
  args: ReturnType<typeof parseAuditArgs>,
  rollingBaseline: BaselineFile | null,
): AuditPass {
  const detected = detectProjectConfig(cwd);
  const inputs = walkProject(cwd, {
    cssOverrides: args.cssOverrides,
    markupOverrides: args.markupOverrides,
    maxFiles: args.maxFiles,
  });
  const results = aggregate(inputs, {
    mandatedAccent: args.mandatedAccent ?? undefined,
    mandatedFontFamily: args.mandatedFontFamily ?? undefined,
    baseUnitPx: args.baseUnitPx ?? undefined,
  });

  let drift: DriftReport | null = null;
  if (!args.noBaseline) {
    drift = diff(results, rollingBaseline);
  }

  return { results, drift, detected, inputs };
}

export async function runAudit(argv: string[]): Promise<number> {
  const args = parseAuditArgs(argv);
  if (args.help) {
    process.stdout.write(renderAuditHelp() + "\n");
    return 0;
  }
  // Fail loudly rather than auditing something the user did not ask for. A
  // swallowed flag silently changes behaviour (e.g. a typo'd --no-telemetry
  // leaves telemetry on) and a swallowed path silently audits the wrong tree.
  if (args.unknownArgs.length > 0) {
    process.stderr.write(
      `dwic audit: unrecognised argument${args.unknownArgs.length > 1 ? "s" : ""}: ${args.unknownArgs.join(", ")}\n` +
        `Run \`dwic audit --help\` to see the supported flags.\n`,
    );
    return 2;
  }

  // A path that isn't there must not audit as clean. Without this the walker
  // finds no CSS and no components, every category reports "clean", and the
  // run exits 0 — a green CI signal for a directory that does not exist.
  if (!existsSync(args.cwd)) {
    process.stderr.write(
      `dwic audit: no such directory: ${args.cwd}\n` +
        `Check the path, or omit it to audit the current directory.\n`,
    );
    return 2;
  }
  if (!statSync(args.cwd).isDirectory()) {
    process.stderr.write(
      `dwic audit: not a directory: ${args.cwd}\n` +
        `Pass a project root, not a file. Use --css=/--markup= to add individual files.\n`,
    );
    return 2;
  }

  const cwd = args.cwd;
  const baselinePath = args.baseline
    ? resolvePath(cwd, args.baseline)
    : resolvePath(cwd, DEFAULT_BASELINE_REL);

  // Read prior on-disk baseline so the first run shows true drift since the
  // last `dwic audit` invocation.
  let rollingBaseline: BaselineFile | null = null;
  if (!args.noBaseline) {
    let priorRaw: string | null = null;
    try {
      priorRaw = existsSync(baselinePath) ? readFileSync(baselinePath, "utf8") : null;
    } catch {
      priorRaw = null;
    }
    rollingBaseline = priorRaw ? parseBaselineFile(priorRaw) : null;
  }

  const first = runOnePass(cwd, args, rollingBaseline);

  if (args.json) {
    process.stdout.write(renderJson(first.detected, first.inputs, first.results, first.drift) + "\n");
    if (!args.noBaseline) writeBaseline(baselinePath, first.results, first.detected.framework);
    const sev = worstOverall(first.results);
    return exitCodeFromSeverity(sev);
  }

  // First-run notice before the report so it's visible, not buried.
  maybePrintFirstRunNotice((line) => process.stdout.write(line + "\n"), !args.telemetry);

  const report = writeMarkdownReport(cwd, first.detected, first.results);

  const text = renderDashboard(first.detected, first.inputs, first.results, {
    reportPath: report.relativePath,
    showInstallCta: true,
    cwd,
    drift: first.drift,
  });
  process.stdout.write(text);

  if (!args.noBaseline) writeBaseline(baselinePath, first.results, first.detected.framework);

  if (args.telemetry) {
    void emitAuditTelemetry({
      version: CLI_VERSION,
      results: first.results,
      detected: first.detected,
      drift: first.drift,
    }).catch(() => {});
  }

  if (args.watch) {
    return await runWatchLoop(cwd, args, first.results, baselinePath);
  }

  return exitCodeFromSeverity(worstOverall(first.results));
}

async function runWatchLoop(
  cwd: string,
  args: ReturnType<typeof parseAuditArgs>,
  initialResults: CategoryResult[],
  baselinePath: string,
): Promise<number> {
  process.stdout.write("\n");
  process.stdout.write("👁  dwic watch — re-auditing on save. Ctrl+C to stop.\n\n");

  // Rolling in-memory baseline. Built from the last completed audit so the
  // next change diffs against the most recent state, not an ancient file.
  let rolling: BaselineFile = buildBaselineFile(initialResults, "watch");

  // Single-flight: if a re-audit is in progress, don't kick off another. Just
  // mark dirty and re-run after.
  let running = false;
  let dirty = false;
  let pendingPath: string | null = null;

  const runOnce = async (changedPath: string) => {
    if (running) {
      dirty = true;
      pendingPath = changedPath;
      return;
    }
    running = true;
    try {
      const pass = runOnePass(cwd, args, rolling);
      const line = renderWatchLine(changedPath, pass.drift);
      process.stdout.write(line + "\n");

      // Update rolling baseline so the next change diffs against this state.
      rolling = buildBaselineFile(pass.results, "watch");

      // Persist the on-disk baseline too — closing the watcher then opening a
      // new session should pick up where we left off.
      if (!args.noBaseline) {
        writeBaseline(baselinePath, pass.results, pass.detected.framework);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      process.stdout.write(`✗ dwic watch: re-audit failed: ${msg}\n`);
    } finally {
      running = false;
      if (dirty) {
        dirty = false;
        const next = pendingPath ?? changedPath;
        pendingPath = null;
        void runOnce(next);
      }
    }
  };

  const handle = startWatcher({
    cwd,
    debounceMs: 300,
    onChange: runOnce,
  });

  // Keep the process alive until SIGINT.
  return await new Promise<number>((resolve) => {
    const stop = () => {
      handle.stop();
      process.stdout.write("\ndwic watch stopped.\n");
      resolve(0);
    };
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
  });
}

function renderWatchLine(relPath: string, drift: DriftReport | null): string {
  const ts = new Date().toTimeString().slice(0, 8); // HH:MM:SS
  if (!drift || (drift.totals.new.error + drift.totals.new.warn + drift.totals.new.info === 0
    && drift.totals.resolved.error + drift.totals.resolved.warn + drift.totals.resolved.info === 0
    && drift.worsened.length === 0)) {
    return `${ts}  ✓  ${relPath}  no drift`;
  }

  // Group changes by category for compact output.
  const byCat = new Map<string, { up: number; down: number; err: number; worse: number }>();
  for (const f of drift.newFindings) {
    const c = byCat.get(f.category) ?? { up: 0, down: 0, err: 0, worse: 0 };
    c.up += 1;
    if (f.finding.severity === "error") c.err += 1;
    byCat.set(f.category, c);
  }
  for (const f of drift.resolvedFindings) {
    const c = byCat.get(f.category) ?? { up: 0, down: 0, err: 0, worse: 0 };
    c.down += 1;
    byCat.set(f.category, c);
  }
  for (const w of drift.worsened) {
    const c = byCat.get(w.category) ?? { up: 0, down: 0, err: 0, worse: 0 };
    c.worse += 1;
    byCat.set(w.category, c);
  }

  const parts: string[] = [];
  for (const [cat, c] of byCat.entries()) {
    const bits: string[] = [];
    if (c.up > 0) bits.push(`↑${c.up}${c.err > 0 ? ` (${c.err} err)` : ""}`);
    if (c.down > 0) bits.push(`↓${c.down} resolved`);
    if (c.worse > 0) bits.push(`⚠${c.worse} worse`);
    parts.push(`${cat} ${bits.join(" ")}`);
  }

  const hasError = Array.from(byCat.values()).some((c) => c.err > 0 || c.worse > 0);
  const hasNew = Array.from(byCat.values()).some((c) => c.up > 0);
  const icon = hasError ? "✗" : hasNew ? "⚠" : "✓";
  return `${ts}  ${icon}  ${relPath}  ${parts.join("  ·  ")}`;
}

function writeBaseline(
  baselinePath: string,
  results: ReturnType<typeof aggregate>,
  framework: string,
): void {
  try {
    mkdirSync(dirname(baselinePath), { recursive: true });
    const file = buildBaselineFile(results, framework);
    writeFileSync(baselinePath, JSON.stringify(file, null, 2), "utf8");
  } catch {
    // Non-fatal — baseline is a convenience, not a contract. If we can't
    // write (read-only fs, permissions), skip silently and the next run
    // simply won't have a baseline.
  }
}

// When run as a direct script (not dispatched from setup.ts), handle argv
// ourselves. The dispatcher wraps this function instead.
const invokedDirectly = process.argv[1]?.endsWith("audit.js") || process.argv[1]?.endsWith("audit.ts");
if (invokedDirectly) {
  runAudit(process.argv)
    .then((code) => process.exit(code))
    .catch((err) => {
      process.stderr.write(`dwic audit: fatal: ${err?.message ?? err}\n`);
      process.exit(1);
    });
}

// Re-export for tests.
export { DEFAULT_BASELINE_REL };
// Suppress an unused-import warning from `join`; keep the path utility close
// in case future flags need to compose more paths.
void join;
