// Spacing token parsing + audit helpers for spacing-specialist audit mode.
// Mirrors the shape of color.ts / typography.ts so the test pattern stays consistent.

export interface SpacingToken {
  name: string;
  value: string;
  px: number | null;
  scope?: string;
}

const SPACING_NAME_RE = /^--(space|spacing|gap|sp|size-spacing)(-|$)/i;

function lengthToPx(raw: string): number | null {
  const px = raw.match(/^(-?[\d.]+)px$/i);
  if (px) return parseFloat(px[1]);
  const rem = raw.match(/^(-?[\d.]+)rem$/i);
  if (rem) return parseFloat(rem[1]) * 16;
  const em = raw.match(/^(-?[\d.]+)em$/i);
  if (em) return parseFloat(em[1]) * 16;
  const unitless = raw.match(/^0$/);
  if (unitless) return 0;
  return null;
}

export function parseSpacingTokensFromCss(css: string): SpacingToken[] {
  const out: SpacingToken[] = [];
  const blockRe = /([^{}]+)\{([^}]*)\}/g;
  let blockMatch: RegExpExecArray | null;
  while ((blockMatch = blockRe.exec(css)) !== null) {
    const selector = blockMatch[1].trim();
    const body = blockMatch[2];
    const declRe = /(--[a-zA-Z0-9-_]+)\s*:\s*([^;]+);/g;
    let declMatch: RegExpExecArray | null;
    while ((declMatch = declRe.exec(body)) !== null) {
      const name = declMatch[1];
      if (!SPACING_NAME_RE.test(name)) continue;
      const value = declMatch[2].trim();
      const px = lengthToPx(value);
      out.push({
        name,
        value,
        px,
        scope: selector === ":root" ? undefined : selector,
      });
    }
  }
  const flat = css.replace(blockRe, "");
  const declRe = /(--[a-zA-Z0-9-_]+)\s*:\s*([^;]+);/g;
  let m: RegExpExecArray | null;
  while ((m = declRe.exec(flat)) !== null) {
    const name = m[1];
    if (!SPACING_NAME_RE.test(name)) continue;
    const value = m[2].trim();
    const px = lengthToPx(value);
    out.push({ name, value, px });
  }
  return out;
}

// Greatest common divisor for positive integers; used to guess base unit.
function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

export function inferBaseUnit(tokens: SpacingToken[]): number | null {
  const positives = tokens
    .map((t) => t.px)
    .filter((n): n is number => typeof n === "number" && n > 0 && Number.isFinite(n));
  if (positives.length === 0) return null;
  // Use small integers preferentially — 2, 4, 8 cover most systems.
  return positives.reduce((acc, n) => gcd(acc, n), positives[0]);
}

export interface SpacingFinding {
  severity: "error" | "warn" | "info";
  token: string;
  message: string;
}

export function auditSpacingTokens(
  tokens: SpacingToken[],
  baseUnitPx: number | undefined,
): SpacingFinding[] {
  const findings: SpacingFinding[] = [];
  const base = baseUnitPx ?? inferBaseUnit(tokens) ?? 4;

  // Non-parseable values (e.g. calc() or var() references)
  for (const t of tokens) {
    if (t.px === null) {
      findings.push({
        severity: "info",
        token: t.name,
        message: `value \`${t.value}\` is not a plain length — can't audit. If this references another token, resolve before audit.`,
      });
    }
  }

  // Base-unit consistency
  const parseable = tokens.filter((t) => t.px !== null) as Array<SpacingToken & { px: number }>;
  for (const t of parseable) {
    if (t.px === 0) continue;
    const remainder = Math.round((t.px / base) * 1000) / 1000;
    const nearestMultiple = Math.round(t.px / base);
    if (Math.abs(remainder - nearestMultiple) > 0.01) {
      findings.push({
        severity: "warn",
        token: t.name,
        message: `${t.px}px is not a clean multiple of base ${base}px (off by ${(
          t.px -
          nearestMultiple * base
        ).toFixed(2)}px). Rhythm breaks when one token sits off-grid.`,
      });
    }
  }

  // Ramp sanity — flag steps that don't follow a roughly doubling/ratio-based progression
  const sorted = [...parseable].sort((a, b) => a.px - b.px);
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1].px;
    const cur = sorted[i].px;
    if (prev === 0 || cur === 0) continue;
    const ratio = cur / prev;
    if (ratio > 3) {
      findings.push({
        severity: "info",
        token: sorted[i].name,
        message: `${prev}px → ${cur}px is a ${ratio.toFixed(1)}× jump. Adjacent steps usually sit within 2× to stay useful for component padding.`,
      });
    }
  }

  return findings;
}

const EXPECTED_STEPS: Array<{ label: string; aliases: RegExp[] }> = [
  { label: "0 / zero", aliases: [/-0$/, /-none$/, /-zero$/] },
  { label: "xs / 1", aliases: [/-xs$/, /-1$/] },
  { label: "sm / 2", aliases: [/-sm$/, /-2$/] },
  { label: "md / 3 / 4", aliases: [/-md$/, /-3$/, /-4$/] },
  { label: "lg / 5 / 6", aliases: [/-lg$/, /-5$/, /-6$/] },
  { label: "xl / 8+", aliases: [/-xl$/, /-7$/, /-8$/, /-9$/] },
];

export function detectStepGaps(tokens: SpacingToken[]): string[] {
  const names = tokens.map((t) => t.name.toLowerCase());
  const gaps: string[] = [];
  for (const { label, aliases } of EXPECTED_STEPS) {
    const found = aliases.some((re) => names.some((n) => re.test(n)));
    if (!found) gaps.push(label);
  }
  return gaps;
}
