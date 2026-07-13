// web/app/design-research/agentic-terminal/data.ts
// Firmed 2026-07-12. Raw sample: docs/research/agentic-terminal-sample.csv
// Method + limits: docs/research/agentic-terminal-workflow-study.md

export const SAMPLE_N = 278;
export const FOOTPRINT_TOTAL = "~770K";

// 95% CI ≈ 18–28%
export const FRONTEND = { count: 63, n: SAMPLE_N, pct: 23, ciPp: 5 };

export interface FootprintRow {
  name: string;
  label: string;
  files: string;
  share: number;
}
export const CONFIG_FOOTPRINT: FootprintRow[] = [
  { name: "CLAUDE.md", label: "Claude Code", files: "~590K", share: 76 },
  { name: "AGENTS.md", label: "agent-agnostic", files: "~150K", share: 19 },
  { name: "Cursor, Windsurf, Cline, Aider", label: "other tools", files: "~29K", share: 4 },
];

// First-commit date of the agent-config file, bucketed by quarter (n=278).
export interface QuarterRow {
  q: string;
  n: number;
  partial?: boolean;
}
export const ADOPTION: QuarterRow[] = [
  { q: "2025 Q2", n: 9 },
  { q: "2025 Q3", n: 23 },
  { q: "2025 Q4", n: 29 },
  { q: "2026 Q1", n: 103 },
  { q: "2026 Q2", n: 109 },
  { q: "2026 Q3", n: 5, partial: true },
];
export const ADOPTION_MAX = 109; // for bar scaling
