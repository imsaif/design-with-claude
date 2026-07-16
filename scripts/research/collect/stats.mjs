// Proportion confidence intervals. Pure.
//
// Uses the Wilson score interval, NOT Wald (p ± z·sqrt(pq/n)). Wald collapses to
// a bogus ±0 at p=0 or p=1 — e.g. it reports "0/40 = 0% ±0pp" when the honest 95%
// upper bound is ~9%. Wilson stays correct at the edges, which the study guardrails
// require (no false precision on a zero cell).

const Z = 1.96; // 95%

// Wilson 95% interval for k successes in n trials. Returns fractions {low, high}.
export function wilson95(k, n) {
  if (n === 0) return { low: 0, high: 1 };
  const p = k / n;
  const z2 = Z * Z;
  const denom = 1 + z2 / n;
  const center = (p + z2 / (2 * n)) / denom;
  const half = (Z / denom) * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n));
  return { low: Math.max(0, center - half), high: Math.min(1, center + half) };
}

// Human-readable "23% (95% CI 18–28%, n=278)" style string.
export function formatCi(k, n) {
  const pct = n ? Math.round((k / n) * 100) : 0;
  const { low, high } = wilson95(k, n);
  return `${pct}% (95% CI ${Math.round(low * 100)}–${Math.round(high * 100)}%, n=${n})`;
}
