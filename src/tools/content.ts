// Copy / content audit helpers for content-strategist. Heuristic checks over
// pasted copy — accepts plain text or HTML/JSX. Focuses on patterns that weaken
// product copy: passive voice, jargon, weak CTA verbs, over-long sentences,
// all-caps shouting, button-text length.

export interface ContentFinding {
  severity: "error" | "warn" | "info";
  element: string;
  message: string;
}

const BUTTON_RE = /<(button|a)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
const TAG_STRIP_RE = /<[^>]+>/g;
const HEADING_RE = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;

// Conservative jargon / filler list. Deliberately short — false positives hurt
// more than false negatives here. Drawn from Plain Language guidelines + the
// Nielsen Norman "10 copy tests" list.
const JARGON = [
  "synergy",
  "synergies",
  "leverage",
  "leveraging",
  "seamless",
  "seamlessly",
  "cutting-edge",
  "best-in-class",
  "world-class",
  "robust",
  "paradigm",
  "utilize",
  "utilizes",
  "utilizing",
  "facilitate",
  "facilitates",
  "holistic",
  "empower",
  "empowering",
  "revolutionary",
  "disruptive",
  "next-generation",
  "next-gen",
  "turnkey",
  "mission-critical",
  "bandwidth",
  "deep dive",
  "move the needle",
];

// Weak / generic CTA verbs that degrade conversion clarity.
const WEAK_CTAS = [
  "click here",
  "click",
  "submit",
  "go",
  "ok",
  "learn more",
  "read more",
  "see more",
  "view more",
  "more",
  "continue",
  "proceed",
];

// Past-participle pattern for passive-voice heuristic. Simple and noisy —
// flags as info only. Looks for: (am|is|are|was|were|be|been|being) + word
// ending in "ed" or a known irregular participle.
const IRREGULAR_PARTICIPLES = new Set([
  "given",
  "taken",
  "seen",
  "done",
  "made",
  "built",
  "brought",
  "bought",
  "caught",
  "chosen",
  "driven",
  "eaten",
  "fallen",
  "forgotten",
  "gotten",
  "hidden",
  "known",
  "shown",
  "sold",
  "told",
  "written",
  "broken",
  "spoken",
  "stolen",
  "torn",
]);
const PASSIVE_RE = /\b(am|is|are|was|were|be|been|being)\s+([a-z]+(?:ed|en))\b/gi;

function stripTags(html: string): string {
  return html.replace(TAG_STRIP_RE, " ").replace(/\s+/g, " ").trim();
}

function splitSentences(text: string): string[] {
  // Cheap splitter — good enough for rough sentence-length checks.
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'(\[])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function truncate(s: string, max = 60): string {
  const c = s.replace(/\s+/g, " ");
  return c.length > max ? c.slice(0, max - 1) + "…" : c;
}

export function auditCTAs(markup: string): ContentFinding[] {
  const findings: ContentFinding[] = [];
  const buttons = Array.from(markup.matchAll(BUTTON_RE));
  if (buttons.length === 0) return findings;

  for (const b of buttons) {
    const tagName = b[1].toLowerCase();
    const attrs = b[2];
    const inner = stripTags(b[3]);
    if (!inner) continue;

    // Skip anchors that clearly aren't CTAs (no explicit role="button" and
    // the text is a long phrase — probably body-link, not a CTA).
    if (tagName === "a" && !/\brole\s*=\s*["']button["']/i.test(attrs) && inner.split(/\s+/).length > 6) {
      continue;
    }

    const lower = inner.toLowerCase();
    const weak = WEAK_CTAS.find((w) => lower === w || lower.replace(/[^\w\s]/g, "") === w);
    if (weak) {
      findings.push({
        severity: "warn",
        element: `<${tagName}>`,
        message: `CTA text "${truncate(inner)}" is generic. Weak verbs like "${weak}" don't tell the user what happens next. Prefer action-outcome phrasing (e.g. "Create account", "Get the report").`,
      });
    }

    const wordCount = inner.split(/\s+/).length;
    if (wordCount > 6) {
      findings.push({
        severity: "info",
        element: `<${tagName}>`,
        message: `CTA "${truncate(inner)}" is ${wordCount} words. Most buttons land at 2–4 words — longer text reads as a sentence, not an action.`,
      });
    }
    if (inner.length > 40) {
      findings.push({
        severity: "info",
        element: `<${tagName}>`,
        message: `CTA "${truncate(inner)}" is ${inner.length} chars — will wrap on mobile widths (< 360px). Shorten or verify the wrap is acceptable.`,
      });
    }
  }
  return findings;
}

export function auditJargon(text: string): ContentFinding[] {
  const findings: ContentFinding[] = [];
  const lower = text.toLowerCase();
  const hits = JARGON.filter((j) => new RegExp(`\\b${j.replace(/[-\s]/g, "[-\\s]")}\\b`, "i").test(lower));
  if (hits.length > 0) {
    findings.push({
      severity: "warn",
      element: "jargon",
      message: `Jargon/filler detected: ${hits.map((h) => `"${h}"`).join(", ")}. These words carry no information — readers skip over them. Replace with the concrete thing the user gets.`,
    });
  }
  return findings;
}

export function auditPassiveVoice(text: string): ContentFinding[] {
  const findings: ContentFinding[] = [];
  const matches = Array.from(text.matchAll(PASSIVE_RE));
  const filtered = matches.filter((m) => {
    const participle = m[2].toLowerCase();
    // Known irregulars are real participles, -ed endings could also be simple
    // past verbs — but "was given", "is created" is typical passive form; we
    // keep this info-level so false positives are tolerable.
    return participle.endsWith("ed") || IRREGULAR_PARTICIPLES.has(participle);
  });
  if (filtered.length >= 2) {
    const sample = filtered.slice(0, 3).map((m) => `"${m[0]}"`).join(", ");
    findings.push({
      severity: "info",
      element: "voice",
      message: `Passive voice detected (${filtered.length} instance${filtered.length === 1 ? "" : "s"}; sample: ${sample}). Active voice ("Claude audits your palette") is almost always clearer than passive ("Your palette is audited by Claude").`,
    });
  }
  return findings;
}

export function auditSentenceLength(text: string): ContentFinding[] {
  const findings: ContentFinding[] = [];
  const sentences = splitSentences(text);
  const longOnes = sentences.filter((s) => s.split(/\s+/).length > 30);
  if (longOnes.length > 0) {
    const worst = longOnes.reduce((a, b) => (a.split(/\s+/).length > b.split(/\s+/).length ? a : b));
    findings.push({
      severity: "warn",
      element: "sentence length",
      message: `${longOnes.length} sentence(s) over 30 words. Longest is ${worst.split(/\s+/).length} words: "${truncate(worst, 90)}" — split at the "and"/"but" or cut the qualifier.`,
    });
  }
  return findings;
}

export function auditShouting(text: string): ContentFinding[] {
  const findings: ContentFinding[] = [];
  const words = text.match(/\b[A-Z]{4,}\b/g) ?? [];
  const nonAcronym = words.filter(
    (w) => !/^(HTML|HTTPS?|JSON|API|CLI|MCP|CSS|ARIA|WCAG|PDF|CSV|JPEG|PNG|GIF|SVG|URL|UUID|PCOS|NOTE|TODO|FIXME|OK)$/.test(w),
  );
  if (nonAcronym.length >= 2) {
    findings.push({
      severity: "warn",
      element: "shouting",
      message: `${nonAcronym.length} all-caps word(s) outside known acronyms (${nonAcronym.slice(0, 3).map((w) => `"${w}"`).join(", ")}). Screen readers spell all-caps letter-by-letter, and sighted users read it as shouting. Use sentence case + bold if emphasis is needed.`,
    });
  }
  return findings;
}

export function auditHeadingCase(markup: string): ContentFinding[] {
  const findings: ContentFinding[] = [];
  const headings = Array.from(markup.matchAll(HEADING_RE));
  if (headings.length === 0) return findings;
  const titleCaseCount = headings.filter((h) => {
    const inner = stripTags(h[2]);
    if (!inner) return false;
    const words = inner.split(/\s+/).filter(Boolean);
    if (words.length < 3) return false;
    const capsWords = words.filter((w) => /^[A-Z]/.test(w) && !/^[A-Z]{2,}$/.test(w));
    return capsWords.length / words.length > 0.8;
  }).length;
  if (titleCaseCount >= 2 && titleCaseCount === headings.length) {
    findings.push({
      severity: "info",
      element: "<h*>",
      message: `All ${headings.length} headings use Title Case. Sentence case ("Get started", not "Get Started") reads faster and is the default for most modern product UIs. Keep Title Case only if it's a deliberate brand choice.`,
    });
  }
  return findings;
}

export function runContentAudit(input: string): ContentFinding[] {
  const plainText = stripTags(input);
  return [
    ...auditCTAs(input),
    ...auditJargon(plainText),
    ...auditPassiveVoice(plainText),
    ...auditSentenceLength(plainText),
    ...auditShouting(plainText),
    ...auditHeadingCase(input),
  ];
}
