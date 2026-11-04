// Lightweight HTML/JSX audit helpers for accessibility-specialist.
// Regex-based (not a full parser) — we flag patterns, not AST shapes. The
// payoff is that we can audit any snippet a designer pastes without babel.

import { neutralizeJsxExpressions, splitComponents } from "./markup-utils.js";

export interface MarkupSource {
  path: string;
  content: string;
}

export interface A11yFinding {
  severity: "error" | "warn" | "info";
  element: string;
  message: string;
}

// Case-sensitive on purpose: `<Image>`, `<Select>` and `<A>` are custom components
// whose own markup is what gets audited. `<Button>`, `<Input>` and `<Textarea>` are
// the exception: in shadcn-style projects they're thin wrappers whose name has to
// come from the caller, so `<Button><X /></Button>` really is an unnamed button.
const IMG_RE = /<img\b[^>]*\/?>/g;
const INPUT_RE = /<(input|textarea|select|Input|Textarea)\b[^>]*\/?>/g;
const HEADING_RE = /<h([1-6])\b[^>]*>/g;
const ANCHOR_RE = /<a\b[^>]*>/g;
const BUTTON_RE = /<(button|Button)\b([^>]*)>([\s\S]*?)<\/\1>/g;
const SELF_CLOSED_BUTTON_RE = /<(?:button|Button)\b[^>]*\/>/g;
const LANDMARK_RE = /<(main|nav|header|footer|aside)\b/g;
const SKIP_LINK_RE = /#(main|content|skip)|\bskip[-\s]?to[-\s]?(main|content)/i;

// `<input {...props} />`: a reusable piece whose label, alt or href comes from
// whoever uses it. Source can't show that, so it isn't a finding here.
function hasSpread(tag: string): boolean {
  return /\{\s*\.\.\./.test(tag);
}

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
    if (hasSpread(tag)) continue;
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
  // `for` in HTML, `htmlFor` in React/JSX, either quoted or as a {"literal"} expression.
  const labelMatches = markup.matchAll(
    /<label\b[^>]*?(?:\bfor|\bhtmlFor)\s*=\s*(?:"([^"]+)"|'([^']+)'|\{\s*["'`]([^"'`]+)["'`]\s*\})/gi,
  );
  for (const m of labelMatches) labelForIds.add((m[1] ?? m[2] ?? m[3] ?? "").trim());
  // Collect label-wrapped inputs (label containing an input)
  const wrappedInputs = new Set<string>();
  const wrapRe = /<label\b[^>]*>[\s\S]*?(<(input|textarea|select)\b[^>]*\/?>)[\s\S]*?<\/label>/gi;
  let w: RegExpExecArray | null;
  while ((w = wrapRe.exec(markup)) !== null) wrappedInputs.add(w[1]);

  for (const tag of matches) {
    if (hasSpread(tag)) continue;
    // Out of the accessibility tree at every size, so nothing announces it.
    // `md:hidden` and `overflow-hidden` don't count.
    if (/(?<![\w:-])hidden(?![\w:-])/.test(tag.replace(/\btype\s*=\s*["'][^"']*["']/i, ""))) continue;
    const type = attrValue(tag, "type");
    if (type && type.toLowerCase() === "hidden") continue;
    if (type && type.toLowerCase() === "submit") continue;

    // id={"email"} in JSX arrives with its quotes; strip them so it matches the label.
    const id = attrValue(tag, "id")?.trim().replace(/^["'`]|["'`]$/g, "") ?? null;
    // A wrapper's `label` prop is usually how it receives its label.
    const hasAriaLabel = hasAttr(tag, "aria-label") || (/^<[A-Z]/.test(tag) && hasAttr(tag, "label"));
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

    // Autocomplete only matters for identity/payment fields. Search inputs,
    // chat-style textareas, anonymous demo inputs (no `name`), and one-off
    // controls don't benefit from autofill — flagging every one of them buries
    // the real signal under dozens of noise findings.
    const lowerType = type ? type.toLowerCase() : "";
    const autocompleteRelevantType =
      !lowerType || ["text", "email", "password", "tel", "url"].includes(lowerType);
    const inputName = (attrValue(tag, "name") || "").toLowerCase();
    const looksLikeIdentityField =
      inputName !== "" &&
      /(email|name|username|user|password|pass|tel|phone|address|street|city|state|zip|postal|country|cc[-_]?(num|number|name|exp|csc|cvc)|credit|card|birthday|dob)/.test(
        inputName,
      );
    if (autocompleteRelevantType && looksLikeIdentityField && !hasAttr(tag, "autocomplete")) {
      findings.push({
        severity: "info",
        element: truncateTag(tag),
        message: `\`name="${inputName}"\` looks like an identity/payment field but has no \`autocomplete\` — password managers and browser autofill degrade. Set the matching token (e.g. \`autocomplete="email"\`) or \`autocomplete="off"\` if intentional.`,
      });
    }
  }
  return findings;
}

interface HeadingRun {
  // Always rendered, in source order.
  fixed: number[];
  // Inside a `{...}` children block: rendered only sometimes.
  conditional: number[];
}

// Walks cleaned source and groups headings into runs that can share a page.
// Each top-level `return` starts a run, because early returns are exclusive.
function headingRuns(markup: string): HeadingRun[] {
  const runs: HeadingRun[] = [{ fixed: [], conditional: [] }];
  let childDepth = 0;
  let lastChildClose = -1;
  for (const m of markup.matchAll(/[{}]|\breturn\b|<h([1-6])\b/g)) {
    const token = m[0];
    if (token === "{") {
      if (childDepth > 0 || opensChildren(markup, m.index, lastChildClose)) childDepth++;
    } else if (token === "}") {
      if (childDepth > 0 && --childDepth === 0) lastChildClose = m.index;
    } else if (token === "return") {
      if (childDepth === 0) runs.push({ fixed: [], conditional: [] });
    } else {
      const run = runs[runs.length - 1]!;
      (childDepth > 0 ? run.conditional : run.fixed).push(parseInt(m[1]!, 10));
    }
  }
  return runs;
}

// True for a `{` straight after a JSX tag or another children block. Not for
// `=> {` or `Component<P> {`.
function opensChildren(markup: string, at: number, lastChildClose: number): boolean {
  let i = at - 1;
  while (i >= 0 && /\s/.test(markup[i]!)) i--;
  if (i === lastChildClose) return true;
  if (markup[i] !== ">" || markup[i - 1] === "=") return false;
  const open = markup.lastIndexOf("<", i);
  if (open < 0) return false;
  return markup[open + 1] === "/" || !/\w/.test(markup[open - 1] ?? "");
}

function headingLevels(markup: string): number[] {
  return Array.from(markup.matchAll(HEADING_RE), (m) => parseInt(m[1], 10));
}

function tooManyH1sInRun(run: HeadingRun, where = ""): A11yFinding[] {
  const fixed = run.fixed.filter((l) => l === 1).length;
  const conditional = run.conditional.filter((l) => l === 1).length;
  // Conditional <h1>s alone are usually alternatives. Beside a fixed one, any of
  // them showing makes two.
  return fixed === 0 ? [] : tooManyH1s(Array(fixed + conditional).fill(1), where);
}

function tooManyH1s(levels: number[], where = ""): A11yFinding[] {
  const h1Count = levels.filter((l) => l === 1).length;
  if (h1Count <= 1) return [];
  return [
    {
      severity: "warn",
      element: `headings${where}`,
      message: `${h1Count} <h1> elements — usually only one per page (document-outline algorithm aside).`,
    },
  ];
}

// One finding is enough per ladder; noise otherwise.
function firstSkippedLevel(levels: number[], where = ""): A11yFinding[] {
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] > levels[i - 1] + 1) {
      return [
        {
          severity: "warn",
          element: `h${levels[i - 1]} → h${levels[i]}${where}`,
          message: `heading level skipped (h${levels[i - 1]} to h${levels[i]}) — screen readers rely on a linear ladder.`,
        },
      ];
    }
  }
  return [];
}

const NO_H1: A11yFinding = {
  severity: "warn",
  element: "headings",
  message: "no <h1> found — most pages should have exactly one.",
};

export function auditHeadings(markup: string): A11yFinding[] {
  const levels = headingLevels(markup);
  if (levels.length === 0) return [];
  const missing = levels.includes(1) ? [] : [NO_H1];
  const runs = headingRuns(markup);
  return [
    ...missing,
    ...runs.flatMap((run) => tooManyH1sInRun(run)),
    ...runs.flatMap((run) => firstSkippedLevel(run.fixed)).slice(0, 1),
  ];
}

// Whole-project variant. Source order across files says nothing about what
// shares a page, and within a file a helper can be defined above the component
// that renders it, so <h1> count and heading order are judged per component.
// Only "no <h1>" stays project-wide: most component files rightly have none.
export function auditHeadingsBySource(sources: MarkupSource[]): A11yFinding[] {
  const perSource = sources.map(({ path, content }) => ({
    where: ` (${path})`,
    runs: splitComponents(neutralizeJsxExpressions(content)).flatMap(headingRuns),
  }));
  const all = perSource.flatMap((s) => s.runs.flatMap((r) => [...r.fixed, ...r.conditional]));
  if (all.length === 0) return [];

  const findings: A11yFinding[] = all.includes(1) ? [] : [NO_H1];
  for (const { where, runs } of perSource) {
    findings.push(...runs.flatMap((run) => tooManyH1sInRun(run, where)));
    findings.push(...runs.flatMap((run) => firstSkippedLevel(run.fixed, where)).slice(0, 1));
  }
  return findings;
}

export function auditAnchors(markup: string): A11yFinding[] {
  const findings: A11yFinding[] = [];
  const matches = markup.match(ANCHOR_RE) ?? [];
  for (const tag of matches) {
    if (hasSpread(tag)) continue;
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
  const re = new RegExp(BUTTON_RE.source, "g");
  // A self-closed <button {...props} /> would otherwise pair with the next
  // </button> and pull unrelated markup into its name.
  const open = markup.replace(SELF_CLOSED_BUTTON_RE, "");
  while ((m = re.exec(open)) !== null) {
    const isCustom = m[1] === "Button";
    const openAttrs = m[2] ?? "";
    const rawInner = m[3] ?? "";
    const inner = rawInner.replace(/<[^>]+>/g, "").trim();
    const openTag = `<button${openAttrs}>`;
    const named =
      hasSpread(openTag) ||
      hasAttr(openTag, "aria-label") ||
      hasAttr(openTag, "aria-labelledby") ||
      hasAttr(openTag, "title") ||
      // A wrapper's `label` prop is usually how it receives its name.
      (isCustom && hasAttr(openTag, "label")) ||
      // A named icon inside the button names the button.
      /\b(?:aria-label|aria-labelledby|title|alt)\s*=/i.test(rawInner);
    if (!inner && !named) {
      findings.push({
        severity: "error",
        element: "<button>",
        message: "button with no text content and no aria-label — screen readers announce it as an unnamed button.",
      });
    }
  }
  return findings;
}

// A skip link is defined by what it does, not what it's called: an in-page link
// to the main landmark's id, in whatever language the project is written in.
function linksToMainLandmark(markup: string): boolean {
  const mainIds = new Set<string>();
  for (const tag of markup.match(/<[a-z][^>]*>/gi) ?? []) {
    if (!/^<main\b/i.test(tag) && !/\brole\s*=\s*["']main["']/i.test(tag)) continue;
    const id = tag.match(/(?<![\w-])id\s*=\s*["']([^"']+)["']/i);
    if (id) mainIds.add(id[1]);
  }
  if (mainIds.size === 0) return false;
  for (const m of markup.matchAll(/<a\b[^>]*\bhref\s*=\s*["']#([^"']+)["']/gi)) {
    if (mainIds.has(m[1])) return true;
  }
  return false;
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

  if (!SKIP_LINK_RE.test(markup) && !linksToMainLandmark(markup)) {
    findings.push({
      severity: "info",
      element: "skip link",
      message: "no skip-to-content link detected — keyboard users must tab through the full nav on every page.",
    });
  }
  return findings;
}

export function runA11yAudit(markup: string, sources?: MarkupSource[]): A11yFinding[] {
  // Strip JSX expression blocks before regex-based tag matching — see
  // src/tools/markup-utils.ts for why.
  const cleaned = neutralizeJsxExpressions(markup);
  return [
    ...auditImages(cleaned),
    ...auditFormControls(cleaned),
    ...(sources?.length ? auditHeadingsBySource(sources) : auditHeadings(cleaned)),
    ...auditAnchors(cleaned),
    ...auditButtons(cleaned),
    ...auditLandmarks(cleaned),
  ];
}

function truncateTag(tag: string, max = 80): string {
  const collapsed = tag.replace(/\s+/g, " ");
  return collapsed.length <= max ? collapsed : `${collapsed.slice(0, max - 1)}…`;
}
