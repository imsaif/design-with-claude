// Terminal renderer. Hand-rolled ANSI — no external deps. Respects NO_COLOR
// and non-TTY outputs so pipes / CI logs stay clean.

import type { WalkedInputs } from "./walker.js";
import { CATEGORY_LABELS, type CategoryResult, type Severity } from "./aggregator.js";
import type { DetectedProjectConfig } from "../utils/detect-project-config.js";

const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

function colorEnabled(): boolean {
  if (process.env.NO_COLOR) return false;
  if (!process.stdout.isTTY) return false;
  return true;
}

function paint(code: string, s: string): string {
  return colorEnabled() ? `${code}${s}${ANSI.reset}` : s;
}

function severityIcon(sev: Severity): string {
  switch (sev) {
    case "error":
      return paint(ANSI.red, "✗");
    case "warn":
      return paint(ANSI.yellow, "⚠");
    case "info":
      return paint(ANSI.cyan, "i");
    case "clean":
      return paint(ANSI.dim, "·");
  }
}

function severityBadge(sev: Severity): string {
  switch (sev) {
    case "error":
      return paint(ANSI.red, "error");
    case "warn":
      return paint(ANSI.yellow, "warn");
    case "info":
      return paint(ANSI.cyan, "info");
    case "clean":
      return paint(ANSI.green, "clean");
  }
}

function severityRank(sev: Severity): number {
  return { error: 0, warn: 1, info: 2, clean: 3 }[sev];
}

function pad(s: string, width: number): string {
  // Visible-width padding that ignores ANSI escapes.
  const visible = s.replace(/\x1b\[[0-9;]*m/g, "");
  const gap = width - visible.length;
  return gap > 0 ? s + " ".repeat(gap) : s;
}

function divider(width = 63): string {
  return paint(ANSI.gray, "─".repeat(width));
}

function formatCount(r: CategoryResult): string {
  const { error, warn, info } = r.counts;
  const total = error + warn + info;
  if (total === 0) return paint(ANSI.green, "clean");
  return `${total} finding${total === 1 ? "" : "s"}`;
}

function followUpsFor(results: CategoryResult[]): Array<{ tool: string; reason: string }> {
  const picks: Array<{ tool: string; reason: string }> = [];
  const withErrors = results.filter((r) => r.severity === "error");
  const withWarns = results.filter((r) => r.severity === "warn");
  const pickOrder = [...withErrors, ...withWarns];
  const CATEGORY_TO_TOOL: Partial<Record<CategoryResult["category"], string>> = {
    color: "color-specialist",
    typography: "typography-specialist",
    spacing: "spacing-specialist",
    accessibility: "accessibility-specialist",
    form: "form-designer",
    navigation: "navigation-specialist",
    motion: "motion-designer",
    copy: "content-strategist",
  };
  for (const r of pickOrder) {
    const tool = CATEGORY_TO_TOOL[r.category];
    if (!tool) continue;
    if (picks.some((p) => p.tool === tool)) continue;
    picks.push({ tool, reason: r.gist });
    if (picks.length >= 3) break;
  }
  return picks;
}

export interface DashboardOptions {
  reportPath: string | null;
  showInstallCta: boolean;
  cwd: string;
}

export function renderDashboard(
  detected: DetectedProjectConfig,
  inputs: WalkedInputs,
  results: CategoryResult[],
  opts: DashboardOptions,
): string {
  const lines: string[] = [];

  lines.push(`${paint(ANSI.bold, "dwic audit")} ${paint(ANSI.dim, "•")} ${paint(ANSI.dim, opts.cwd)}`);

  const cssLabel =
    inputs.totals.cssCount === 0
      ? paint(ANSI.dim, "no CSS found")
      : `${inputs.totals.cssCount} CSS file${inputs.totals.cssCount === 1 ? "" : "s"}`;
  const markupLabel =
    inputs.totals.markupCount === 0
      ? paint(ANSI.dim, "no components found")
      : `${inputs.totals.markupCount} component${inputs.totals.markupCount === 1 ? "" : "s"}`;
  const stackLabel =
    detected.techStack.length > 0
      ? paint(ANSI.dim, detected.techStack.join(", "))
      : paint(ANSI.dim, "stack unknown");
  lines.push(`${paint(ANSI.dim, "Scanned:")} ${cssLabel} · ${markupLabel} · ${stackLabel}`);
  if (inputs.totals.cappedAt !== null) {
    lines.push(
      paint(ANSI.dim, `(capped markup scan at ${inputs.markupFiles.length} of ${inputs.totals.cappedAt} files; pass --max-files to change)`),
    );
  }
  lines.push(divider());
  lines.push("");

  const sorted = [...results].sort((a, b) => severityRank(a.severity) - severityRank(b.severity));
  for (const r of sorted) {
    const label = pad(CATEGORY_LABELS[r.category], 16);
    const icon = pad(severityIcon(r.severity), 3);
    const count = pad(formatCount(r), 14);
    lines.push(`  ${label}${icon}${count}${paint(ANSI.dim, r.gist)}`);
  }

  lines.push("");
  lines.push(divider());
  const totalFindings = results.reduce((a, r) => a + r.counts.error + r.counts.warn + r.counts.info, 0);
  const totalErr = results.reduce((a, r) => a + r.counts.error, 0);
  const totalWarn = results.reduce((a, r) => a + r.counts.warn, 0);
  const totalInfo = results.reduce((a, r) => a + r.counts.info, 0);
  lines.push(
    `  ${results.length} categories · ${totalFindings} finding${totalFindings === 1 ? "" : "s"} · ${severityBadge("error")} ${totalErr} · ${severityBadge("warn")} ${totalWarn} · ${severityBadge("info")} ${totalInfo}`,
  );

  const followUps = followUpsFor(results);
  if (followUps.length > 0) {
    lines.push("");
    lines.push(paint(ANSI.bold, "Run any specialist inside Claude Code for the full detail + fixes:"));
    for (const p of followUps) {
      lines.push(`  ${paint(ANSI.cyan, ">")} ${paint(ANSI.bold, p.tool)} with mode:"audit"   ${paint(ANSI.dim, `— ${p.reason}`)}`);
    }
  } else {
    lines.push("");
    lines.push(paint(ANSI.green, "No errors or warnings — system looks consistent on static analysis."));
  }

  if (opts.reportPath) {
    lines.push("");
    lines.push(`${paint(ANSI.dim, "Report written to")} ${opts.reportPath}`);
  }

  if (opts.showInstallCta) {
    lines.push("");
    lines.push(paint(ANSI.dim, "Install dwic to run these inside Claude Code:"));
    lines.push(`  ${paint(ANSI.cyan, "npx @imrandwc/dwic setup --token=<get one at designwithclaude.com/start>")}`);
  }

  lines.push("");
  return lines.join("\n");
}

// Machine-readable variant for `--json`. Avoids emojis / ANSI so CI can parse.
export function renderJson(
  detected: DetectedProjectConfig,
  inputs: WalkedInputs,
  results: CategoryResult[],
): string {
  return JSON.stringify(
    {
      schema: "dwic.audit.summary/1",
      project: {
        framework: detected.framework,
        techStack: detected.techStack,
        slug: detected.slug,
      },
      scanned: {
        cssCount: inputs.totals.cssCount,
        markupCount: inputs.totals.markupCount,
        cappedAt: inputs.totals.cappedAt,
      },
      results: results.map((r) => ({
        category: r.category,
        severity: r.severity,
        counts: r.counts,
        gist: r.gist,
        findings: r.findings,
      })),
    },
    null,
    2,
  );
}
