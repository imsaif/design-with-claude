#!/usr/bin/env node
// Entry point for `dwic audit`. The `dwic` setup CLI dispatches here when
// argv[2] === "audit". Also runnable directly: `node dist/bin/audit.js audit`.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve as resolvePath } from "node:path";
import { parseAuditArgs, renderAuditHelp } from "../audit/args.js";
import { walkProject } from "../audit/walker.js";
import { aggregate, exitCodeFromSeverity, worstOverall } from "../audit/aggregator.js";
import { renderDashboard, renderJson } from "../audit/dashboard.js";
import { writeMarkdownReport } from "../audit/markdown-report.js";
import { detectProjectConfig } from "../utils/detect-project-config.js";
import { emitAuditTelemetry, maybePrintFirstRunNotice } from "../audit/telemetry.js";
import { buildBaselineFile, diff, parseBaselineFile } from "../audit/drift.js";

const CLI_VERSION = "1.0.0-alpha.3";
const DEFAULT_BASELINE_REL = ".dwic/baseline.json";

export async function runAudit(argv: string[]): Promise<number> {
  const args = parseAuditArgs(argv);
  if (args.help) {
    process.stdout.write(renderAuditHelp() + "\n");
    return 0;
  }

  const cwd = args.cwd;
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

  // Baseline IO: read prior, diff against now. Skipped if --no-baseline.
  const baselinePath = args.baseline
    ? resolvePath(cwd, args.baseline)
    : resolvePath(cwd, DEFAULT_BASELINE_REL);
  let drift = null;
  if (!args.noBaseline) {
    let priorRaw: string | null = null;
    try {
      priorRaw = existsSync(baselinePath) ? readFileSync(baselinePath, "utf8") : null;
    } catch {
      priorRaw = null;
    }
    const baseline = priorRaw ? parseBaselineFile(priorRaw) : null;
    drift = diff(results, baseline);
  }

  if (args.json) {
    process.stdout.write(renderJson(detected, inputs, results, drift) + "\n");
    // Persist baseline even in JSON mode — the file is the contract for the
    // next run, regardless of how this run was rendered.
    if (!args.noBaseline) writeBaseline(baselinePath, results, detected.framework);
    const sev = worstOverall(results);
    return exitCodeFromSeverity(sev);
  }

  // First-run notice before the report so it's visible, not buried.
  maybePrintFirstRunNotice((line) => process.stdout.write(line + "\n"), !args.telemetry);

  const report = writeMarkdownReport(cwd, detected, results);

  const text = renderDashboard(detected, inputs, results, {
    reportPath: report.relativePath,
    showInstallCta: true,
    cwd,
    drift,
  });
  process.stdout.write(text);

  // Persist the new baseline AFTER rendering so the user sees a diff against
  // the prior run, not an empty diff against themselves.
  if (!args.noBaseline) writeBaseline(baselinePath, results, detected.framework);

  if (args.telemetry) {
    // Fire-and-forget — never block exit.
    void emitAuditTelemetry({
      version: CLI_VERSION,
      results,
      detected,
      drift,
    }).catch(() => {});
  }

  return exitCodeFromSeverity(worstOverall(results));
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
