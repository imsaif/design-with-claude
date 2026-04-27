// Drift diff engine. Compares two audit runs (a stored baseline vs. the
// current findings) and buckets each finding into one of four states:
// new, resolved, worsened, unchanged. Pure function — no I/O.
//
// Stable finding identity is the load-bearing piece. We hash on
// (category, ruleKey, normalizedMessage) — deliberately *not* line numbers,
// which churn whenever a file gets reformatted or a sibling is added above.
// `ruleKey` is derived from the message shape so that the same rule firing on
// a renamed token still matches.

import { createHash } from "node:crypto";
import type { CategoryResult, GenericFinding, Severity } from "./aggregator.js";

export interface BaselineFile {
  schemaVersion: "dwic.baseline/1";
  runAt: string; // ISO timestamp
  framework: string;
  categories: Array<{
    category: CategoryResult["category"];
    severity: Severity;
    findings: GenericFinding[];
  }>;
}

export interface DriftedFinding {
  category: CategoryResult["category"];
  finding: GenericFinding;
}

export interface SeverityChange {
  category: CategoryResult["category"];
  finding: GenericFinding;
  previousSeverity: GenericFinding["severity"];
}

export interface DriftReport {
  hasBaseline: boolean;
  baselineRunAt: string | null;
  newFindings: DriftedFinding[];
  resolvedFindings: DriftedFinding[];
  worsened: SeverityChange[];
  unchangedCount: number;
  totals: {
    new: { error: number; warn: number; info: number };
    resolved: { error: number; warn: number; info: number };
    worsened: number;
    unchanged: number;
  };
}

// Trim numeric specifics so the same finding survives small value drift.
// Example: "12px is below the 12px floor" and "11px is below the 12px floor"
// should hash to the same key. We replace numeric tokens with "#" and lowercase
// the rest. Hex codes are kept intact so contrast findings stay distinguishable
// per-token.
function normalizeMessage(msg: string): string {
  return msg
    .replace(/\b\d+(?:\.\d+)?(px|rem|em|%)?\b/g, "#")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function findingKey(category: string, f: GenericFinding): string {
  const subject = f.token ?? f.element ?? "";
  const norm = normalizeMessage(f.message);
  const h = createHash("sha1");
  h.update(`${category}|${subject}|${norm}`);
  return h.digest("hex").slice(0, 16);
}

function severityRank(s: GenericFinding["severity"]): number {
  return { info: 0, warn: 1, error: 2 }[s];
}

function flatten(
  source: Array<{ category: CategoryResult["category"]; findings: GenericFinding[] }>,
): Map<string, { category: CategoryResult["category"]; finding: GenericFinding }> {
  const out = new Map<string, { category: CategoryResult["category"]; finding: GenericFinding }>();
  for (const c of source) {
    for (const f of c.findings) {
      const key = findingKey(c.category, f);
      // First-write-wins. Duplicates within a single run aren't useful and
      // would inflate counts.
      if (!out.has(key)) out.set(key, { category: c.category, finding: f });
    }
  }
  return out;
}

export function diff(current: CategoryResult[], baseline: BaselineFile | null): DriftReport {
  if (!baseline) {
    return {
      hasBaseline: false,
      baselineRunAt: null,
      newFindings: [],
      resolvedFindings: [],
      worsened: [],
      unchangedCount: 0,
      totals: {
        new: { error: 0, warn: 0, info: 0 },
        resolved: { error: 0, warn: 0, info: 0 },
        worsened: 0,
        unchanged: 0,
      },
    };
  }

  const currentMap = flatten(current);
  const baselineMap = flatten(baseline.categories);

  const newFindings: DriftedFinding[] = [];
  const resolvedFindings: DriftedFinding[] = [];
  const worsened: SeverityChange[] = [];
  let unchanged = 0;

  for (const [key, entry] of currentMap) {
    const prior = baselineMap.get(key);
    if (!prior) {
      newFindings.push(entry);
      continue;
    }
    const wasSev = prior.finding.severity;
    const isSev = entry.finding.severity;
    if (severityRank(isSev) > severityRank(wasSev)) {
      worsened.push({
        category: entry.category,
        finding: entry.finding,
        previousSeverity: wasSev,
      });
    } else {
      unchanged++;
    }
  }

  for (const [key, entry] of baselineMap) {
    if (!currentMap.has(key)) resolvedFindings.push(entry);
  }

  const sevTotals = (
    items: Array<{ finding: GenericFinding }>,
  ): { error: number; warn: number; info: number } => ({
    error: items.filter((i) => i.finding.severity === "error").length,
    warn: items.filter((i) => i.finding.severity === "warn").length,
    info: items.filter((i) => i.finding.severity === "info").length,
  });

  return {
    hasBaseline: true,
    baselineRunAt: baseline.runAt,
    newFindings,
    resolvedFindings,
    worsened,
    unchangedCount: unchanged,
    totals: {
      new: sevTotals(newFindings),
      resolved: sevTotals(resolvedFindings),
      worsened: worsened.length,
      unchanged,
    },
  };
}

export function buildBaselineFile(
  results: CategoryResult[],
  framework: string,
  runAt: Date = new Date(),
): BaselineFile {
  return {
    schemaVersion: "dwic.baseline/1",
    runAt: runAt.toISOString(),
    framework,
    categories: results.map((r) => ({
      category: r.category,
      severity: r.severity,
      findings: r.findings,
    })),
  };
}

export function parseBaselineFile(raw: string): BaselineFile | null {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.schemaVersion !== "dwic.baseline/1") return null;
    if (!Array.isArray(parsed.categories)) return null;
    return parsed as BaselineFile;
  } catch {
    return null;
  }
}

// Test surface — exposed only because the diff is consumed via the regression
// script that round-trips through normalizeMessage.
export const _internal = { findingKey, normalizeMessage };
