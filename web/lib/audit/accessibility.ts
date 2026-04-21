// Lightweight HTML/JSX audit helpers for accessibility-specialist.
// Regex-based (not a full parser) — we flag patterns, not AST shapes. The
// payoff is that we can audit any snippet a designer pastes without babel.

export interface A11yFinding {
  severity: "error" | "warn" | "info";
  element: string;
  message: string;
}

const IMG_RE = /<img\b[^>]*\/?>/gi;
const INPUT_RE = /<(input|textarea|select)\b[^>]*\/?>/gi;
const HEADING_RE = /<h([1-6])\b[^>]*>/gi;
const ANCHOR_RE = /<a\b[^>]*>/gi;
const BUTTON_RE = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
const LANDMARK_RE = /<(main|nav|header|footer|aside)\b/gi;
const SKIP_LINK_RE = /#(main|content|skip)|\bskip[-\s]?to[-\s]?(main|content)/i;

function hasAttr(tag: string, name: string): boolean {
  const re = new RegExp(`\\b${name}\\s*=`, "i");
  return re.test(tag);
}

function attrValue(tag: string, name: string): string | null {
  const re = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|\\{([^}]+)\\})`, "i");
  const m = tag.match(re);
  if (!m) return null;
  return m[1] ?? m[2] ?? m[3] ?? null;
}

export function auditImages(markup: string): A11yFinding[] {
  const findings: A11yFinding[] = [];
  const matches = markup.match(IMG_RE) ?? [];
  for (const tag of matches) {
    if (!hasAttr(tag, "alt")) {
      findings.push({
        severity: "error",
        element: truncateTag(tag),
        message: "no alt attribute — screen readers announce the filename or skip the image entirely.",
      });
      continue;
    }
    const alt = attrValue(tag, "alt");
    if (alt !== null && alt.trim().length === 0 && !hasAttr(tag, "role")) {
      findings.push({
        severity: "info",
        element: truncateTag(tag),
        message: "empty alt — correct for decorative images; confirm this one is purely decorative.",
      });
    }
  }
  return findings;
}

export function auditFormControls(markup: string): A11yFinding[] {
  const findings: A11yFinding[] = [];
  const matches = markup.match(INPUT_RE) ?? [];
  // Collect label[for=...] ids to resolve association
  const labelForIds = new Set<string>();
  const labelMatches = markup.matchAll(/<label\b[^>]*\bfor\s*=\s*(?:"([^"]+)"|'([^']+)')/gi);
  for (const m of labelMatches) labelForIds.add((m[1] ?? m[2] ?? "").trim());
  // Collect label-wrapped inputs (label containing an input)
  const wrappedInputs = new Set<string>();
  const wrapRe = /<label\b[^>]*>[\s\S]*?(<(input|textarea|select)\b[^>]*\/?>)[\s\S]*?<\/label>/gi;
  let w: RegExpExecArray | null;
  while ((w = wrapRe.exec(markup)) !== null) wrappedInputs.add(w[1]);

  for (const tag of matches) {
    const type = attrValue(tag, "type");
    if (type && type.toLowerCase() === "hidden") continue;
    if (type && type.toLowerCase() === "submit") continue;

    const id = attrValue(tag, "id");
    const hasAriaLabel = hasAttr(tag, "aria-label");
    const hasAriaLabelledBy = hasAttr(tag, "aria-labelledby");
    const hasFor = id ? labelForIds.has(id) : false;
    const isWrapped = wrappedInputs.has(tag);

    if (!hasFor && !hasAriaLabel && !hasAriaLabelledBy && !isWrapped) {
      findings.push({
        severity: "error",
        element: truncateTag(tag),
        message: "no accessible label — needs <label for=id>, wrapping <label>, aria-label, or aria-labelledby.",
      });
    }

    const isTextual = !type || ["text", "email", "password", "tel", "url", "search", "number"].includes(type.toLowerCase());
    if (isTextual && !hasAttr(tag, "autocomplete")) {
      findings.push({
        severity: "info",
        element: truncateTag(tag),
        message: "no autocomplete attribute — password managers and browser autofill degrade. Set `autocomplete=\"off\"` if intentional.",
      });
    }
  }
  return findings;
}

export function auditHeadings(markup: string): A11yFinding[] {
  const findings: A11yFinding[] = [];
  const levels: number[] = [];
  const matches = markup.matchAll(HEADING_RE);
  for (const m of matches) levels.push(parseInt(m[1], 10));

  if (levels.length === 0) return findings;

  const h1Count = levels.filter((l) => l === 1).length;
  if (h1Count === 0) {
    findings.push({
      severity: "warn",
      element: "headings",
      message: "no <h1> found — most pages should have exactly one.",
    });
  } else if (h1Count > 1) {
    findings.push({
      severity: "warn",
      element: "headings",
      message: `${h1Count} <h1> elements — usually only one per page (document-outline algorithm aside).`,
    });
  }

  for (let i = 1; i < levels.length; i++) {
    if (levels[i] > levels[i - 1] + 1) {
      findings.push({
        severity: "warn",
        element: `h${levels[i - 1]} → h${levels[i]}`,
        message: `heading level skipped (h${levels[i - 1]} to h${levels[i]}) — screen readers rely on a linear ladder.`,
      });
      break; // one finding is enough; noise otherwise
    }
  }
  return findings;
}

export function auditAnchors(markup: string): A11yFinding[] {
  const findings: A11yFinding[] = [];
  const matches = markup.match(ANCHOR_RE) ?? [];
  for (const tag of matches) {
    const href = attrValue(tag, "href");
    if (!hasAttr(tag, "href")) {
      findings.push({
        severity: "warn",
        element: truncateTag(tag),
        message: "<a> without href is not keyboard-focusable — use <button> for click handlers without a destination.",
      });
      continue;
    }
    if (href === "#" || href === "javascript:void(0)") {
      findings.push({
        severity: "warn",
        element: truncateTag(tag),
        message: "href=\"#\" or javascript: — anchor is being used as a button. Swap to <button>.",
      });
    }
  }
  return findings;
}

export function auditButtons(markup: string): A11yFinding[] {
  const findings: A11yFinding[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(BUTTON_RE.source, "gi");
  while ((m = re.exec(markup)) !== null) {
    const openAttrs = m[1] ?? "";
    const inner = (m[2] ?? "").replace(/<[^>]+>/g, "").trim();
    const openTag = `<button${openAttrs}>`;
    const hasAriaLabel = hasAttr(openTag, "aria-label");
    const hasAriaLabelledBy = hasAttr(openTag, "aria-labelledby");
    if (!inner && !hasAriaLabel && !hasAriaLabelledBy) {
      findings.push({
        severity: "error",
        element: "<button>",
        message: "button with no text content and no aria-label — screen readers announce it as an unnamed button.",
      });
    }
  }
  return findings;
}

export function auditLandmarks(markup: string): A11yFinding[] {
  const findings: A11yFinding[] = [];
  const seen = new Set<string>();
  const matches = markup.matchAll(LANDMARK_RE);
  for (const m of matches) seen.add(m[1].toLowerCase());

  if (!seen.has("main")) {
    findings.push({
      severity: "warn",
      element: "<main>",
      message: "no <main> landmark — screen-reader users rely on it to jump past the nav.",
    });
  }
  if (!seen.has("nav") && /<(a|ul|ol|li)\b/.test(markup)) {
    // Only flag nav if markup plausibly contains navigation
    findings.push({
      severity: "info",
      element: "<nav>",
      message: "no <nav> landmark — wrap primary navigation links in <nav> with an aria-label.",
    });
  }

  if (!SKIP_LINK_RE.test(markup)) {
    findings.push({
      severity: "info",
      element: "skip link",
      message: "no skip-to-content link detected — keyboard users must tab through the full nav on every page.",
    });
  }
  return findings;
}

export function runA11yAudit(markup: string): A11yFinding[] {
  return [
    ...auditImages(markup),
    ...auditFormControls(markup),
    ...auditHeadings(markup),
    ...auditAnchors(markup),
    ...auditButtons(markup),
    ...auditLandmarks(markup),
  ];
}

function truncateTag(tag: string, max = 80): string {
  const collapsed = tag.replace(/\s+/g, " ");
  return collapsed.length <= max ? collapsed : `${collapsed.slice(0, max - 1)}…`;
}
