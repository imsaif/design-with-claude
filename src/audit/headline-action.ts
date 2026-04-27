// Picks the single most-actionable next step from an audit run, with a
// Claude-Code-paste-able prompt and a one-line outcome. The dashboard's
// existing "follow-ups" list keeps three options for breadth; this picks ONE
// for conversion.
//
// Ranking: errors before warns; within errors, mandated-* drift wins; within
// the rest, follow CATEGORY_PRIORITY.

import type { CategoryResult, Severity } from "./aggregator.js";

export interface HeadlineAction {
  category: CategoryResult["category"];
  tool: string;
  prompt: string;
  outcome: string;
}

const CATEGORY_TO_TOOL: Record<CategoryResult["category"], string> = {
  color: "color-specialist",
  typography: "typography-specialist",
  spacing: "spacing-specialist",
  accessibility: "accessibility-specialist",
  form: "form-designer",
  navigation: "navigation-specialist",
  motion: "motion-designer",
  copy: "content-strategist",
};

// Prefer the surface a designer is most likely to feel next. Accessibility
// outranks aesthetics because failing AA blocks shipping in most teams.
const CATEGORY_PRIORITY: Record<CategoryResult["category"], number> = {
  accessibility: 0,
  color: 1,
  form: 2,
  typography: 3,
  spacing: 4,
  navigation: 5,
  motion: 6,
  copy: 7,
};

const PROMPT_BY_CATEGORY: Record<CategoryResult["category"], string> = {
  color: "audit my color tokens — flag every WCAG AA failure and rebuild the ramp pinned to the brand accent.",
  typography: "audit my typography tokens — call out anything that breaks the type scale or mandated font.",
  spacing: "audit my spacing tokens — call out off-grid values and missing steps in the scale.",
  accessibility: "audit my markup for accessibility — focus on unlabeled inputs, heading order, and missing landmarks.",
  form: "audit my forms — call out unlabeled inputs, missing fieldsets, and weak error wiring.",
  navigation: "audit my navigation — call out missing aria-current, skip links, and disclosure issues.",
  motion: "audit my motion CSS — flag missing prefers-reduced-motion guards and runaway transitions.",
  copy: "audit my UI copy — call out weak CTAs, jargon, and over-long sentences.",
};

const OUTCOME_BY_CATEGORY: Record<CategoryResult["category"], string> = {
  color: "Returns a passing palette + a contrast matrix you can paste into your tokens file.",
  typography: "Returns a coherent type ramp aligned to your mandated font and base size.",
  spacing: "Returns a clean spacing scale snapped to a single base unit.",
  accessibility: "Returns specific markup fixes per finding, ranked by severity.",
  form: "Returns drop-in form markup with labels, fieldsets, and error wiring.",
  navigation: "Returns a corrected nav structure with proper landmarks and disclosure.",
  motion: "Returns motion CSS with reduced-motion guards and tighter durations.",
  copy: "Returns rewritten copy that lands the action without jargon.",
};

function severityRank(s: Severity): number {
  return { error: 0, warn: 1, info: 2, clean: 3 }[s];
}

export function pickHeadlineAction(results: CategoryResult[]): HeadlineAction | null {
  // Surface mandated-* drift first if any exists. This is the highest-signal
  // finding because it represents *intent* drift, not just lint.
  const withMandatedDrift = results.find((r) =>
    r.findings.some((f) => /mandated/i.test(f.message)),
  );
  if (withMandatedDrift) return shape(withMandatedDrift);

  // Else: highest severity, lowest CATEGORY_PRIORITY.
  const candidates = results
    .filter((r) => r.severity !== "clean")
    .sort((a, b) => {
      const sev = severityRank(a.severity) - severityRank(b.severity);
      if (sev !== 0) return sev;
      return CATEGORY_PRIORITY[a.category] - CATEGORY_PRIORITY[b.category];
    });

  if (candidates.length === 0) return null;
  return shape(candidates[0]!);
}

function shape(r: CategoryResult): HeadlineAction {
  return {
    category: r.category,
    tool: CATEGORY_TO_TOOL[r.category],
    prompt: PROMPT_BY_CATEGORY[r.category],
    outcome: OUTCOME_BY_CATEGORY[r.category],
  };
}
