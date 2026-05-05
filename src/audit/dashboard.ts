// Terminal renderer. Hand-rolled ANSI — no external deps. Respects NO_COLOR
// and non-TTY outputs so pipes / CI logs stay clean.

import type { WalkedInputs } from "./walker.js";
import { CATEGORY_LABELS, type CategoryResult, type Severity } from "./aggregator.js";
import type { DetectedProjectConfig } from "../utils/detect-project-config.js";
import type { DriftReport } from "./drift.js";
import { pickHeadlineAction } from "./headline-action.js";
import { getRelatedPatterns, patternUrl } from "../data/aiex-pattern-map.js";

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

function relativeTimeLabel(iso: string): string {
  try {
    const then = new Date(iso).getTime();
    if (!Number.isFinite(then)) return iso;
    const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
    if (seconds < 60) return "just now";
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 48) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    const days = Math.round(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  } catch {
    return iso;
  }
}

export interface DashboardOptions {
  reportPath: string | null;
  showInstallCta: boolean;
  cwd: string;
  drift: DriftReport | null;
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

  // Drift block — sits above the category table when a baseline existed.
  if (opts.drift) {
    lines.push("");
    if (!opts.drift.hasBaseline) {
      lines.push(paint(ANSI.dim, "First audit on this project. Triage the items below; re-run anytime to see what's drifted."));
    } else {
      const t = opts.drift.totals;
      const newErr = t.new.error;
      const resolvedTotal = t.resolved.error + t.resolved.warn + t.resolved.info;
      const parts: string[] = [];
      const upArrow = paint(ANSI.red, "↑");
      const downArrow = paint(ANSI.green, "↓");
      const flat = paint(ANSI.dim, "→");
      const newTotal = t.new.error + t.new.warn + t.new.info;
      if (newTotal === 0 && resolvedTotal === 0 && t.worsened === 0) {
        parts.push(`${flat} no drift since last run`);
      } else {
        if (newTotal > 0) parts.push(`${upArrow} ${newTotal} new${newErr > 0 ? ` (${newErr} error${newErr === 1 ? "" : "s"})` : ""}`);
        if (t.worsened > 0) parts.push(`${upArrow} ${t.worsened} worsened`);
        if (resolvedTotal > 0) parts.push(`${downArrow} ${resolvedTotal} resolved`);
        if (t.unchanged > 0) parts.push(`${flat} ${t.unchanged} unchanged`);
      }
      const stamp = opts.drift.baselineRunAt
        ? paint(ANSI.dim, `last run ${relativeTimeLabel(opts.drift.baselineRunAt)}`)
        : "";
      lines.push(`${paint(ANSI.bold, "Since last run:")}  ${parts.join(" · ")}${stamp ? "  " + stamp : ""}`);
    }
  }

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

  // Related AI UX patterns — for each category that has findings, cite the
  // most relevant pattern from aiuxdesign.guide. Designers can deepen their
  // fix beyond the structural rule the audit caught.
  const dirtyCategories = sorted.filter(
    (r) => r.counts.error + r.counts.warn + r.counts.info > 0,
  );
  if (dirtyCategories.length > 0) {
    lines.push("");
    lines.push(paint(ANSI.bold, "Related AI UX patterns:") + paint(ANSI.dim, "  (aiuxdesign.guide)"));
    for (const r of dirtyCategories) {
      const related = getRelatedPatterns(r.category, 2);
      if (related.length === 0) continue;
      const cited = related
        .map((p) => `${p.title} ${paint(ANSI.dim, patternUrl(p.slug))}`)
        .join(paint(ANSI.dim, "  ·  "));
      lines.push(`  ${pad(CATEGORY_LABELS[r.category], 16)}${cited}`);
    }
  }

  // Headline action — ONE specialist with a paste-able prompt + outcome line.
  const headline = pickHeadlineAction(results);
  if (headline) {
    lines.push("");
    lines.push(paint(ANSI.bold, "What to do next:"));
    lines.push(`  ${paint(ANSI.cyan, ">")} In Claude Code, ask ${paint(ANSI.bold, headline.tool)} to:`);
    lines.push(`     ${paint(ANSI.cyan, `"${headline.prompt}"`)}`);
    lines.push(`  ${paint(ANSI.dim, headline.outcome)}`);
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
    lines.push(paint(ANSI.dim, "Want this inside Claude Code? Install the MCP and call the specialists interactively:"));
    lines.push(`  ${paint(ANSI.cyan, "npx @imrandwc/dwic setup --token=<get one at designwithclaude.com/get-started>")}`);
  }

  lines.push("");
  return lines.join("\n");
}

// Machine-readable variant for `--json`. Avoids emojis / ANSI so CI can parse.
export function renderJson(
  detected: DetectedProjectConfig,
  inputs: WalkedInputs,
  results: CategoryResult[],
  drift: DriftReport | null,
): string {
  const headline = pickHeadlineAction(results);
  return JSON.stringify(
    {
      schema: "dwic.audit.summary/2",
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
      drift: drift
        ? {
            hasBaseline: drift.hasBaseline,
            baselineRunAt: drift.baselineRunAt,
            totals: drift.totals,
            new: drift.newFindings,
            resolved: drift.resolvedFindings,
            worsened: drift.worsened,
          }
        : null,
      headlineAction: headline,
    },
    null,
    2,
  );
}
