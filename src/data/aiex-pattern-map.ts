// Maps each dwic audit category to relevant AI UX patterns from aiuxdesign.guide.
// The audit itself is structural (tokens, contrast, markup); these mappings let
// us cite the AI UX pattern a designer should consult when a finding lands in a
// given category. Snapshot data lives in aiex-patterns.ts (36 patterns).

import { AIEX_PATTERNS, type AiexPattern } from "./aiex-patterns.js";
import type { Category } from "../audit/aggregator.js";

export type { AiexPattern };
export { AIEX_PATTERNS };
export const AIEX_BASE_URL = "https://www.aiuxdesign.guide/patterns";

const PATTERN_BY_SLUG = new Map(AIEX_PATTERNS.map((p) => [p.slug, p]));

// Curated mapping — most-relevant first. Limited to 3 per category so the
// dashboard footer stays readable. These are picked by hand, not algorithmically.
const CATEGORY_TO_SLUGS: Record<Category, string[]> = {
  color: ["confidence-visualization", "universal-access-patterns"],
  typography: ["progressive-disclosure", "universal-access-patterns"],
  spacing: ["progressive-disclosure", "adaptive-interfaces"],
  accessibility: ["universal-access-patterns", "vulnerable-user-protection"],
  form: ["error-recovery", "human-in-the-loop", "confidence-visualization"],
  navigation: ["progressive-disclosure", "context-switching", "agent-status-monitoring"],
  motion: ["predictive-anticipation", "agent-status-monitoring", "progressive-enhancement"],
  copy: ["explainable-ai", "responsible-ai-design", "trust-calibration"],
};

export function getRelatedPatterns(category: Category, limit = 2): AiexPattern[] {
  const slugs = CATEGORY_TO_SLUGS[category] ?? [];
  return slugs
    .map((slug) => PATTERN_BY_SLUG.get(slug))
    .filter((p): p is AiexPattern => p != null)
    .slice(0, limit);
}

export function patternUrl(slug: string): string {
  return `${AIEX_BASE_URL}/${slug}`;
}
