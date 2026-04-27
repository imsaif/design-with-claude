// Navigation-structure audit helpers for navigation-specialist. Focused on
// wayfinding patterns: landmark presence + labeling, current-page indication,
// skip links, nested depth, disclosure pattern for mobile.

import { neutralizeJsxExpressions } from "./markup-utils.js";

export interface NavFinding {
  severity: "error" | "warn" | "info";
  element: string;
  message: string;
}

const NAV_BLOCK_RE = /<nav\b([^>]*)>([\s\S]*?)<\/nav>/gi;
const ANCHOR_RE = /<a\b([^>]*)>/gi;

function hasAttr(tag: string, name: string): boolean {
  const re = new RegExp(`\\b${name}\\s*=|\\b${name}\\b(?=\\s|/|>)`, "i");
  return re.test(tag);
}

function attrValue(tag: string, name: string): string | null {
  const re = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|\\{([^}]+)\\})`, "i");
  const m = tag.match(re);
  if (!m) return null;
  return m[1] ?? m[2] ?? m[3] ?? null;
}

function maxNestedListDepth(block: string): number {
  // Cheap depth check: count max `<ul>` or `<ol>` nesting. Doesn't parse the
  // tree, just tracks open/close. Good enough to flag "your menu is 5 deep".
  let depth = 0;
  let max = 0;
  const re = /<\/?(ul|ol)\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block)) !== null) {
    if (m[0].startsWith("</")) {
      depth = Math.max(0, depth - 1);
    } else {
      depth++;
      if (depth > max) max = depth;
    }
  }
  return max;
}

export function auditNavLandmarks(markup: string): NavFinding[] {
  const findings: NavFinding[] = [];
  const navs = Array.from(markup.matchAll(NAV_BLOCK_RE));
  if (navs.length === 0) {
    // If there are anchor lists plausibly doing navigation, flag absence
    if (/<(ul|ol)\b[^>]*>[\s\S]*?<a\b/.test(markup)) {
      findings.push({
        severity: "warn",
        element: "<nav>",
        message: "anchors inside a <ul>/<ol> but no <nav> landmark — screen-reader users lose the 'jump to navigation' shortcut.",
      });
    }
    return findings;
  }
  if (navs.length > 1) {
    const unlabeled = navs.filter(
      (n) => !hasAttr(`<nav${n[1]}>`, "aria-label") && !hasAttr(`<nav${n[1]}>`, "aria-labelledby"),
    );
    if (unlabeled.length > 0) {
      findings.push({
        severity: "warn",
        element: "<nav>",
        message: `${navs.length} <nav> landmarks detected; ${unlabeled.length} without aria-label or aria-labelledby. Multiple navs need distinguishing labels (e.g. "Primary", "Footer").`,
      });
    }
  }
  return findings;
}

export function auditCurrentPage(markup: string): NavFinding[] {
  const findings: NavFinding[] = [];
  const navs = Array.from(markup.matchAll(NAV_BLOCK_RE));
  if (navs.length === 0) return findings;

  let hasAriaCurrent = false;
  let activeClassSeen = false;
  for (const nav of navs) {
    const block = nav[2];
    const anchors = Array.from(block.matchAll(ANCHOR_RE));
    for (const a of anchors) {
      const tag = `<a${a[1]}>`;
      if (hasAttr(tag, "aria-current")) hasAriaCurrent = true;
      const cls = attrValue(tag, "class") ?? attrValue(tag, "className") ?? "";
      if (/\b(active|current|selected|is-active|is-current)\b/i.test(cls)) activeClassSeen = true;
    }
  }
  if (activeClassSeen && !hasAriaCurrent) {
    findings.push({
      severity: "warn",
      element: "aria-current",
      message: "active/current/selected class on nav link(s) but no `aria-current=\"page\"` anywhere. Screen readers don't infer 'active' from CSS classes.",
    });
  }
  return findings;
}

export function auditSkipLink(markup: string): NavFinding[] {
  const findings: NavFinding[] = [];
  if (!/<nav\b/i.test(markup)) return findings;
  const skipLinkRe = /href\s*=\s*(?:"#(?:main|content|skip)|'#(?:main|content|skip))|\bskip[-\s]?to[-\s]?(?:main|content)/i;
  if (!skipLinkRe.test(markup)) {
    findings.push({
      severity: "info",
      element: "skip link",
      message: "no skip-to-content link detected — keyboard users must tab through every nav link to reach main content on every page.",
    });
  }
  return findings;
}

export function auditNestingDepth(markup: string): NavFinding[] {
  const findings: NavFinding[] = [];
  const navs = Array.from(markup.matchAll(NAV_BLOCK_RE));
  for (const nav of navs) {
    const block = nav[2];
    const depth = maxNestedListDepth(block);
    if (depth >= 4) {
      findings.push({
        severity: "warn",
        element: "<nav>",
        message: `menu nesting is ${depth} levels deep. Users lose context past level 2–3; consider a flatter IA, mega-menu, or drill-down pattern.`,
      });
    }
  }
  return findings;
}

export function auditMobileDisclosure(markup: string): NavFinding[] {
  const findings: NavFinding[] = [];
  const navs = Array.from(markup.matchAll(NAV_BLOCK_RE));
  for (const nav of navs) {
    const block = nav[2];
    const linkCount = (block.match(ANCHOR_RE) ?? []).length;
    if (linkCount < 5) continue;
    const nearbyButtonExpanded = /\baria-expanded\b/i.test(block);
    const hamburgerHint = /(hamburger|menu[-_]?toggle|menu[-_]?button|open[-_]?menu|disclosure)/i.test(block);
    if (!nearbyButtonExpanded && !hamburgerHint) {
      findings.push({
        severity: "info",
        element: "<nav>",
        message: `${linkCount} links in one nav with no disclosure toggle (no \`aria-expanded\` button, no hamburger/menu hint). Verify the mobile layout exposes them without horizontal scroll.`,
      });
    }
  }
  return findings;
}

export function runNavAudit(markup: string): NavFinding[] {
  const cleaned = neutralizeJsxExpressions(markup);
  return [
    ...auditNavLandmarks(cleaned),
    ...auditCurrentPage(cleaned),
    ...auditSkipLink(cleaned),
    ...auditNestingDepth(cleaned),
    ...auditMobileDisclosure(cleaned),
  ];
}
