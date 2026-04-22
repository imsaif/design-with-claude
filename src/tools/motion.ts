// Motion audit helpers for motion-designer. Parses CSS for transitions,
// animations, and reduced-motion support. Flags patterns that break users:
// no prefers-reduced-motion fallback, runaway durations, animation on layout
// properties, `transition: all`, infinite loops without pause.

export interface MotionFinding {
  severity: "error" | "warn" | "info";
  element: string;
  message: string;
}

// Layout / paint properties that should NEVER be animated (force reflow or
// don't composite on the GPU). Animating these locks the main thread.
const EXPENSIVE_PROPS = new Set([
  "top",
  "left",
  "right",
  "bottom",
  "width",
  "height",
  "margin",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "padding",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "border-width",
  "font-size",
]);

// Match "transition: <shorthand>" and "transition-*" declarations and
// "animation: <shorthand>" and "animation-*" declarations.
const TRANSITION_DECL_RE = /transition(?:-[a-z-]+)?\s*:\s*([^;{}]+)/gi;
const ANIMATION_DECL_RE = /animation(?:-[a-z-]+)?\s*:\s*([^;{}]+)/gi;
const DURATION_RE = /(\d*\.?\d+)\s*(ms|s)\b/i;
const REDUCED_MOTION_RE = /@media[^{]*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/i;
const KEYFRAMES_RE = /@keyframes\s+[a-zA-Z_][\w-]*\s*\{/g;

function toMs(value: string): number | null {
  const m = value.match(DURATION_RE);
  if (!m) return null;
  const n = Number(m[1]);
  if (Number.isNaN(n)) return null;
  return m[2].toLowerCase() === "s" ? n * 1000 : n;
}

function extractProperty(transitionValue: string): string {
  // "transform 200ms ease-in-out" → "transform"
  const first = transitionValue.trim().split(/\s+/)[0];
  return (first ?? "").toLowerCase();
}

export function auditReducedMotion(css: string): MotionFinding[] {
  const findings: MotionFinding[] = [];
  const hasAnimation = /\b(transition|animation)(?:-[a-z-]+)?\s*:/i.test(css) || KEYFRAMES_RE.test(css);
  if (!hasAnimation) return findings;
  if (!REDUCED_MOTION_RE.test(css)) {
    findings.push({
      severity: "error",
      element: "@media (prefers-reduced-motion)",
      message:
        "Animations/transitions declared but no `@media (prefers-reduced-motion: reduce)` rule. Users with vestibular disorders (~35% of adults experience motion-triggered discomfort) have no escape hatch. Wrap non-essential motion in a reduced-motion guard, or set `animation: none`/`transition: none` inside one.",
    });
  }
  return findings;
}

export function auditDurations(css: string): MotionFinding[] {
  const findings: MotionFinding[] = [];
  const all = [...css.matchAll(TRANSITION_DECL_RE), ...css.matchAll(ANIMATION_DECL_RE)];
  const tooLong: string[] = [];
  const tooShort: string[] = [];
  for (const m of all) {
    const ms = toMs(m[1]);
    if (ms === null) continue;
    if (ms > 1000) tooLong.push(`${ms}ms`);
    else if (ms > 0 && ms < 80) tooShort.push(`${ms}ms`);
  }
  if (tooLong.length > 0) {
    findings.push({
      severity: "warn",
      element: "duration",
      message: `${tooLong.length} animation/transition(s) longer than 1000ms (e.g. ${tooLong.slice(0, 3).join(", ")}). Micro-interactions land at 100–300ms; anything over 500ms starts feeling slow. Reserve > 1s for large-surface reveals only.`,
    });
  }
  if (tooShort.length > 0) {
    findings.push({
      severity: "info",
      element: "duration",
      message: `${tooShort.length} animation/transition(s) under 80ms (e.g. ${tooShort.slice(0, 3).join(", ")}). Below ~80ms users don't perceive motion — the change just "happens". If it's intended as instant, consider removing the transition entirely.`,
    });
  }
  return findings;
}

export function auditTransitionAll(css: string): MotionFinding[] {
  const findings: MotionFinding[] = [];
  const matches = Array.from(css.matchAll(TRANSITION_DECL_RE));
  const allUses = matches.filter((m) => /^\s*all\b/i.test(m[1]) || /\s+all\s+/i.test(m[1]));
  if (allUses.length > 0) {
    findings.push({
      severity: "warn",
      element: "transition: all",
      message: `${allUses.length} rule(s) use \`transition: all\`. This animates every property change — including layout shifts, color updates, and unrelated state changes — and causes surprise animations when properties change for other reasons. Name the exact properties (e.g. \`transform, opacity\`).`,
    });
  }
  return findings;
}

export function auditExpensiveProperties(css: string): MotionFinding[] {
  const findings: MotionFinding[] = [];
  const hits: string[] = [];
  for (const m of css.matchAll(TRANSITION_DECL_RE)) {
    const prop = extractProperty(m[1]);
    if (EXPENSIVE_PROPS.has(prop)) hits.push(prop);
  }
  // For `animation`, the properties are inside @keyframes — check those blocks.
  const kfRe = /@keyframes\s+[a-zA-Z_][\w-]*\s*\{([\s\S]*?)\n\}/g;
  for (const kf of css.matchAll(kfRe)) {
    const body = kf[1];
    for (const prop of EXPENSIVE_PROPS) {
      const re = new RegExp(`\\b${prop.replace(/-/g, "\\-")}\\s*:`, "i");
      if (re.test(body)) hits.push(prop);
    }
  }
  if (hits.length > 0) {
    const unique = Array.from(new Set(hits));
    findings.push({
      severity: "warn",
      element: "animated property",
      message: `Animating layout properties (${unique.slice(0, 4).map((p) => `\`${p}\``).join(", ")}) forces reflow on every frame and can jank on low-end devices. Prefer \`transform\` (translate/scale) + \`opacity\` — they composite on the GPU.`,
    });
  }
  return findings;
}

export function auditInfiniteLoops(css: string): MotionFinding[] {
  const findings: MotionFinding[] = [];
  const matches = Array.from(css.matchAll(ANIMATION_DECL_RE));
  const infinite = matches.filter((m) => /\binfinite\b/i.test(m[1]));
  if (infinite.length === 0) return findings;

  // Flag only if no reduced-motion override exists — infinite inside a guard
  // is usually fine (spinner outside guard, none inside).
  const hasReducedMotion = REDUCED_MOTION_RE.test(css);
  findings.push({
    severity: hasReducedMotion ? "info" : "warn",
    element: "animation-iteration-count: infinite",
    message: `${infinite.length} infinite animation(s) detected. Continuous motion is a known focus and cognitive-load drain. ${
      hasReducedMotion
        ? "Verify the reduced-motion block cancels these (e.g. `animation: none`)."
        : "Pair with a `prefers-reduced-motion: reduce` rule that stops them, or trigger on hover/focus only."
    }`,
  });
  return findings;
}

export function auditEasing(css: string): MotionFinding[] {
  const findings: MotionFinding[] = [];
  const matches = [...css.matchAll(TRANSITION_DECL_RE), ...css.matchAll(ANIMATION_DECL_RE)];
  if (matches.length === 0) return findings;
  const linearCount = matches.filter((m) => /\blinear\b/i.test(m[1])).length;
  // `linear` is fine for opacity + progress bars; flag only when > 50% of
  // rules use it, suggesting it's the default not a choice.
  if (matches.length >= 3 && linearCount / matches.length > 0.5) {
    findings.push({
      severity: "info",
      element: "easing",
      message: `${linearCount} of ${matches.length} rules use \`linear\` easing. Linear feels mechanical for UI motion — ease-out (entering) / ease-in (exiting) / cubic-bezier(0.4, 0, 0.2, 1) read as "natural". Reserve linear for continuous things (spinners, progress).`,
    });
  }
  return findings;
}

export function runMotionAudit(css: string): MotionFinding[] {
  return [
    ...auditReducedMotion(css),
    ...auditDurations(css),
    ...auditTransitionAll(css),
    ...auditExpensiveProperties(css),
    ...auditInfiniteLoops(css),
    ...auditEasing(css),
  ];
}
