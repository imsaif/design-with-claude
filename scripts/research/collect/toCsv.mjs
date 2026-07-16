// CSV shaping for a study sample. Emits the EXACT column shape of
// docs/research/agentic-terminal-sample.csv so drafts drop into the existing
// "raw CSV + method" reproducibility slot with no schema drift.
//
// All functions here are pure (no network, no fs).

export const CSV_HEADER = "repo,fingerprint,first_commit,quarter,is_frontend";

// ISO date -> calendar quarter label, e.g. "2026-03-15T..." -> "2026Q1". UTC.
export function quarterOf(isoDate) {
  const d = new Date(isoDate);
  const year = d.getUTCFullYear();
  const quarter = Math.floor(d.getUTCMonth() / 3) + 1;
  return `${year}Q${quarter}`;
}

// Build a canonical row object with quarter derived + is_frontend normalized to 0/1.
export function rowFrom({ repo, fingerprint, firstCommit, isFrontend }) {
  return {
    repo,
    fingerprint,
    first_commit: firstCommit,
    quarter: quarterOf(firstCommit),
    is_frontend: isFrontend ? 1 : 0,
  };
}

// rows: array of objects with the 5 canonical keys -> CSV string (trailing newline).
export function toCsv(rows) {
  const lines = [CSV_HEADER];
  for (const r of rows) {
    lines.push([r.repo, r.fingerprint, r.first_commit, r.quarter, r.is_frontend ? 1 : 0].join(","));
  }
  return lines.join("\n") + "\n";
}
