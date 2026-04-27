// Audit aggregator. Calls each category's pure audit helpers on the walked
// project inputs, rolls findings up into CategoryResult objects that the
// dashboard + markdown report both render from.

import type { WalkedInputs } from "./walker.js";
import { parseTokensFromCss, contrastRatio, classifyContrast } from "../tools/color.js";
import {
  parseTypeTokensFromCss,
  auditSizeTokens,
  auditLineHeightTokens,
  auditWeightTokens,
} from "../tools/typography.js";
import { parseSpacingTokensFromCss, auditSpacingTokens } from "../tools/spacing.js";
import { checkMandatedFamily } from "../tools/typography.js";
import { runA11yAudit } from "../tools/accessibility.js";
import { runFormAudit } from "../tools/form.js";
import { runNavAudit } from "../tools/navigation.js";
import { runMotionAudit } from "../tools/motion.js";
import { runContentAudit } from "../tools/content.js";

export type Category =
  | "color"
  | "typography"
  | "spacing"
  | "accessibility"
  | "form"
  | "navigation"
  | "motion"
  | "copy";

export type Severity = "clean" | "info" | "warn" | "error";

export interface GenericFinding {
  severity: Exclude<Severity, "clean">;
  message: string;
  token?: string;
  element?: string;
}

export interface CategoryResult {
  category: Category;
  severity: Severity;
  findings: GenericFinding[];
  gist: string;
  counts: { error: number; warn: number; info: number };
}

const CATEGORY_ORDER: Category[] = [
  "color",
  "typography",
  "spacing",
  "accessibility",
  "form",
  "navigation",
  "motion",
  "copy",
];

export const CATEGORY_LABELS: Record<Category, string> = {
  color: "Color",
  typography: "Typography",
  spacing: "Spacing",
  accessibility: "Accessibility",
  form: "Forms",
  navigation: "Navigation",
  motion: "Motion",
  copy: "Copy",
};

// Each specialist's finding type has slightly different fields; normalize into
// GenericFinding so the downstream renderers don't care which category they're
// looking at.
function escalate(a: Severity, b: Severity): Severity {
  const order: Severity[] = ["clean", "info", "warn", "error"];
  return order[Math.max(order.indexOf(a), order.indexOf(b))];
}

function counts(findings: GenericFinding[]): { error: number; warn: number; info: number } {
  return {
    error: findings.filter((f) => f.severity === "error").length,
    warn: findings.filter((f) => f.severity === "warn").length,
    info: findings.filter((f) => f.severity === "info").length,
  };
}

function worstSeverity(findings: GenericFinding[]): Severity {
  if (findings.length === 0) return "clean";
  if (findings.some((f) => f.severity === "error")) return "error";
  if (findings.some((f) => f.severity === "warn")) return "warn";
  return "info";
}

function truncateGist(s: string, max = 55): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}

// --- Category builders ----------------------------------------------------

export interface AggregateOptions {
  mandatedAccent?: string;
  mandatedFontFamily?: string;
  baseUnitPx?: number;
}

function buildColorResult(css: string, opts: AggregateOptions): CategoryResult {
  const tokens = parseTokensFromCss(css);
  const findings: GenericFinding[] = [];
  if (tokens.length === 0) {
    return {
      category: "color",
      severity: "clean",
      findings: [],
      gist: "no color tokens detected",
      counts: { error: 0, warn: 0, info: 0 },
    };
  }
  const surfaces = ["#ffffff", "#121212"];
  let aaFailCount = 0;
  for (const t of tokens) {
    for (const s of surfaces) {
      const ratio = contrastRatio(t.hex, s);
      const c = classifyContrast(ratio);
      if (!c.aaBody && !c.aaLarge) {
        aaFailCount++;
        findings.push({
          severity: "warn",
          token: t.name,
          message: `${t.hex} on ${s} fails WCAG AA (ratio ${ratio.toFixed(2)}; AA large 3, AA body 4.5).`,
        });
        break; // one finding per token against the first failing surface
      }
    }
  }

  // Mandated-accent check.
  if (opts.mandatedAccent) {
    const hit = tokens.find((t) => t.hex.toLowerCase() === opts.mandatedAccent!.toLowerCase());
    if (!hit) {
      findings.push({
        severity: "error",
        token: "mandated accent",
        message: `Brand-mandated accent ${opts.mandatedAccent} is not present in any --color-* token. Drift risk — verify the primary ramp is pinned.`,
      });
    }
  }

  const gistParts: string[] = [];
  if (aaFailCount > 0) gistParts.push(`${aaFailCount} AA fail${aaFailCount === 1 ? "" : "s"}`);
  if (opts.mandatedAccent) {
    const hit = tokens.find((t) => t.hex.toLowerCase() === opts.mandatedAccent!.toLowerCase());
    if (!hit) gistParts.push(`mandated ${opts.mandatedAccent} missing`);
  }
  if (gistParts.length === 0) gistParts.push(`${tokens.length} tokens, no failures`);

  return {
    category: "color",
    severity: worstSeverity(findings),
    findings,
    gist: truncateGist(gistParts.join(" · ")),
    counts: counts(findings),
  };
}

function buildTypographyResult(css: string, opts: AggregateOptions): CategoryResult {
  const tokens = parseTypeTokensFromCss(css);
  if (tokens.length === 0) {
    return {
      category: "typography",
      severity: "clean",
      findings: [],
      gist: "no type tokens detected",
      counts: { error: 0, warn: 0, info: 0 },
    };
  }
  const sizes = tokens.filter((t) => t.kind === "size");
  const lh = tokens.filter((t) => t.kind === "lineHeight");
  const weights = tokens.filter((t) => t.kind === "weight");
  const families = tokens.filter((t) => t.kind === "family");
  const raw = [
    ...auditSizeTokens(sizes),
    ...auditLineHeightTokens(lh),
    ...auditWeightTokens(weights),
  ];
  const findings: GenericFinding[] = raw.map((f) => ({
    severity: f.severity,
    token: f.token,
    message: f.message,
  }));

  if (opts.mandatedFontFamily) {
    const check = checkMandatedFamily(families, css, opts.mandatedFontFamily);
    if (check.status === "missing") {
      findings.push({
        severity: "error",
        token: "mandated font",
        message: check.detail,
      });
    }
  }
  const sev = worstSeverity(findings);
  const gist =
    findings.length > 0
      ? truncateGist(
          `${sizes.length} size · ${lh.length} lh · ${weights.length} weight; ${findings.length} finding${findings.length === 1 ? "" : "s"}`,
        )
      : truncateGist(`${sizes.length} size · ${lh.length} lh · ${weights.length} weight, clean`);
  return { category: "typography", severity: sev, findings, gist, counts: counts(findings) };
}

function buildSpacingResult(css: string, opts: AggregateOptions): CategoryResult {
  const tokens = parseSpacingTokensFromCss(css);
  if (tokens.length === 0) {
    return {
      category: "spacing",
      severity: "clean",
      findings: [],
      gist: "no spacing tokens detected",
      counts: { error: 0, warn: 0, info: 0 },
    };
  }
  const raw = auditSpacingTokens(tokens, opts.baseUnitPx);
  const findings: GenericFinding[] = raw.map((f) => ({
    severity: f.severity,
    token: f.token,
    message: f.message,
  }));
  const offGrid = findings.filter((f) => /not a clean multiple/.test(f.message));
  const gist =
    offGrid.length > 0
      ? truncateGist(`${tokens.length} steps; ${offGrid.length} off-grid`)
      : truncateGist(`${tokens.length} steps, clean`);
  return { category: "spacing", severity: worstSeverity(findings), findings, gist, counts: counts(findings) };
}

function buildA11yResult(markup: string): CategoryResult {
  if (!markup.trim()) {
    return {
      category: "accessibility",
      severity: "clean",
      findings: [],
      gist: "no markup scanned",
      counts: { error: 0, warn: 0, info: 0 },
    };
  }
  const raw = runA11yAudit(markup);
  const findings: GenericFinding[] = raw.map((f) => ({
    severity: f.severity,
    element: f.element,
    message: f.message,
  }));
  const c = counts(findings);
  const gist =
    findings.length > 0
      ? truncateGist(`${c.error} error${c.error === 1 ? "" : "s"} · ${c.warn} warn${c.warn === 1 ? "" : "s"}`)
      : "clean";
  return { category: "accessibility", severity: worstSeverity(findings), findings, gist, counts: c };
}

function buildFormResult(markup: string): CategoryResult {
  if (!/<(form|input|textarea|select|button)\b/i.test(markup)) {
    return {
      category: "form",
      severity: "clean",
      findings: [],
      gist: "no form markup detected",
      counts: { error: 0, warn: 0, info: 0 },
    };
  }
  const raw = runFormAudit(markup);
  const findings: GenericFinding[] = raw.map((f) => ({
    severity: f.severity,
    element: f.element,
    message: f.message,
  }));
  const unlabeled = findings.filter((f) => /label/i.test(f.message)).length;
  const fieldset = findings.filter((f) => /fieldset/i.test(f.message)).length;
  const parts: string[] = [];
  if (unlabeled > 0) parts.push(`${unlabeled} unlabeled input${unlabeled === 1 ? "" : "s"}`);
  if (fieldset > 0) parts.push(`${fieldset} missing fieldset${fieldset === 1 ? "" : "s"}`);
  if (parts.length === 0 && findings.length > 0) parts.push(`${findings.length} finding${findings.length === 1 ? "" : "s"}`);
  if (parts.length === 0) parts.push("clean");
  return { category: "form", severity: worstSeverity(findings), findings, gist: truncateGist(parts.join(" · ")), counts: counts(findings) };
}

function buildNavResult(markup: string): CategoryResult {
  if (!/<nav\b/i.test(markup)) {
    return {
      category: "navigation",
      severity: "clean",
      findings: [],
      gist: "no <nav> detected",
      counts: { error: 0, warn: 0, info: 0 },
    };
  }
  const raw = runNavAudit(markup);
  const findings: GenericFinding[] = raw.map((f) => ({
    severity: f.severity,
    element: f.element,
    message: f.message,
  }));
  const gist = findings.length > 0 ? truncateGist(`${findings.length} finding${findings.length === 1 ? "" : "s"}`) : "clean";
  return { category: "navigation", severity: worstSeverity(findings), findings, gist, counts: counts(findings) };
}

function buildMotionResult(css: string): CategoryResult {
  if (!/\b(transition|animation|@keyframes)\b/i.test(css)) {
    return {
      category: "motion",
      severity: "clean",
      findings: [],
      gist: "no motion declared",
      counts: { error: 0, warn: 0, info: 0 },
    };
  }
  const raw = runMotionAudit(css);
  const findings: GenericFinding[] = raw.map((f) => ({
    severity: f.severity,
    element: f.element,
    message: f.message,
  }));
  const reducedMotionMissing = findings.some((f) => /prefers-reduced-motion/i.test(f.message) && f.severity === "error");
  const gist = reducedMotionMissing
    ? "no @media (prefers-reduced-motion)"
    : findings.length > 0
      ? truncateGist(`${findings.length} finding${findings.length === 1 ? "" : "s"}`)
      : "clean";
  return { category: "motion", severity: worstSeverity(findings), findings, gist, counts: counts(findings) };
}

function buildCopyResult(markup: string): CategoryResult {
  if (!markup.trim()) {
    return {
      category: "copy",
      severity: "clean",
      findings: [],
      gist: "no copy scanned",
      counts: { error: 0, warn: 0, info: 0 },
    };
  }
  const raw = runContentAudit(markup);
  const findings: GenericFinding[] = raw.map((f) => ({
    severity: f.severity,
    element: f.element,
    message: f.message,
  }));
  const ctaHits = findings.filter((f) => /CTA/.test(f.message)).length;
  const jargon = findings.filter((f) => /Jargon/i.test(f.message)).length;
  const parts: string[] = [];
  if (ctaHits > 0) parts.push(`${ctaHits} weak CTA${ctaHits === 1 ? "" : "s"}`);
  if (jargon > 0) parts.push(`jargon detected`);
  if (parts.length === 0 && findings.length > 0) parts.push(`${findings.length} finding${findings.length === 1 ? "" : "s"}`);
  if (parts.length === 0) parts.push("clean");
  return { category: "copy", severity: worstSeverity(findings), findings, gist: truncateGist(parts.join(" · ")), counts: counts(findings) };
}

export function aggregate(inputs: WalkedInputs, opts: AggregateOptions = {}): CategoryResult[] {
  const { cssContent, markupContent } = inputs;
  return [
    buildColorResult(cssContent, opts),
    buildTypographyResult(cssContent, opts),
    buildSpacingResult(cssContent, opts),
    buildA11yResult(markupContent),
    buildFormResult(markupContent),
    buildNavResult(markupContent),
    buildMotionResult(cssContent),
    buildCopyResult(markupContent),
  ];
}

export function worstOverall(results: CategoryResult[]): Severity {
  return results.reduce<Severity>((acc, r) => escalate(acc, r.severity), "clean");
}

export function exitCodeFromSeverity(sev: Severity): number {
  if (sev === "error") return 2;
  if (sev === "warn") return 1;
  return 0;
}

export { CATEGORY_ORDER };
