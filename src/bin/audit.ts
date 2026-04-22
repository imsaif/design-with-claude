#!/usr/bin/env node
// Entry point for `dwic audit`. The `dwic` setup CLI dispatches here when
// argv[2] === "audit". Also runnable directly: `node dist/bin/audit.js audit`.

import { parseAuditArgs, renderAuditHelp } from "../audit/args.js";
import { walkProject } from "../audit/walker.js";
import { aggregate, exitCodeFromSeverity, worstOverall } from "../audit/aggregator.js";
import { renderDashboard, renderJson } from "../audit/dashboard.js";
import { writeMarkdownReport } from "../audit/markdown-report.js";
import { detectProjectConfig } from "../utils/detect-project-config.js";
import { emitAuditTelemetry, maybePrintFirstRunNotice } from "../audit/telemetry.js";

const CLI_VERSION = "1.0.0-alpha.3";

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
  const results = aggregate(inputs);

  if (args.json) {
    process.stdout.write(renderJson(detected, inputs, results) + "\n");
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
  });
  process.stdout.write(text);

  if (args.telemetry) {
    // Fire-and-forget — never block exit.
    void emitAuditTelemetry({
      version: CLI_VERSION,
      results,
      detected,
    }).catch(() => {});
  }

  return exitCodeFromSeverity(worstOverall(results));
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
