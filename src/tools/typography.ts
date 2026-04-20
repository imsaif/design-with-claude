// Typography token parsing + audit helpers for typography-specialist audit mode.
// Mirrors the shape of color.ts so the test/rollout pattern stays consistent.

export type TypeTokenKind = "size" | "lineHeight" | "weight" | "family";

export interface TypeToken {
  name: string;
  value: string;
  kind: TypeTokenKind;
  scope?: string;
}

const KIND_BY_NAME: Array<{ kind: TypeTokenKind; re: RegExp }> = [
  { kind: "size", re: /^--(font-size|text-size|type-size|text|type|heading-size|font)(-|$)/i },
  { kind: "lineHeight", re: /^--(line-height|leading|lh)(-|$)/i },
  { kind: "weight", re: /^--(font-weight|weight|fw)(-|$)/i },
  { kind: "family", re: /^--(font-family|font|type-family|family)(-|$)/i },
];

function classifyName(name: string): TypeTokenKind | null {
  if (/line-height|leading|^--lh/i.test(name)) return "lineHeight";
  if (/weight|^--fw/i.test(name)) return "weight";
  if (/family/i.test(name)) return "family";
  if (/size|^--text-|^--type-|^--font-[0-9a-z]/i.test(name)) return "size";
  for (const { kind, re } of KIND_BY_NAME) if (re.test(name)) return kind;
  return null;
}

export function parseTypeTokensFromCss(css: string): TypeToken[] {
  const out: TypeToken[] = [];
  const blockRe = /([^{}]+)\{([^}]*)\}/g;
  let blockMatch: RegExpExecArray | null;
  while ((blockMatch = blockRe.exec(css)) !== null) {
    const selector = blockMatch[1].trim();
    const body = blockMatch[2];
    const declRe = /(--[a-zA-Z0-9-_]+)\s*:\s*([^;]+);/g;
    let declMatch: RegExpExecArray | null;
    while ((declMatch = declRe.exec(body)) !== null) {
      const name = declMatch[1];
      const value = declMatch[2].trim();
      const kind = classifyName(name);
      if (kind) {
        out.push({
          name,
          value,
          kind,
          scope: selector === ":root" ? undefined : selector,
        });
      }
    }
  }
  const flat = css.replace(blockRe, "");
  const declRe = /(--[a-zA-Z0-9-_]+)\s*:\s*([^;]+);/g;
  let m: RegExpExecArray | null;
  while ((m = declRe.exec(flat)) !== null) {
    const name = m[1];
    const value = m[2].trim();
    const kind = classifyName(name);
    if (kind) out.push({ name, value, kind });
  }
  return out;
}

// Pull the minimum px from a clamp() or a plain rem/px. Returns null if we
// can't read a size out of it (e.g. token references another var).
export function minPxFromSizeValue(value: string): number | null {
  const clampMatch = value.match(/clamp\(\s*([^,]+),[^,]+,\s*([^)]+)\)/i);
  if (clampMatch) {
    const minPx = readLengthAsPx(clampMatch[1].trim());
    return minPx;
  }
  return readLengthAsPx(value);
}

export function maxPxFromSizeValue(value: string): number | null {
  const clampMatch = value.match(/clamp\(\s*([^,]+),[^,]+,\s*([^)]+)\)/i);
  if (clampMatch) {
    return readLengthAsPx(clampMatch[2].trim());
  }
  return readLengthAsPx(value);
}

function readLengthAsPx(raw: string): number | null {
  const px = raw.match(/^(-?[\d.]+)px$/i);
  if (px) return parseFloat(px[1]);
  const rem = raw.match(/^(-?[\d.]+)rem$/i);
  if (rem) return parseFloat(rem[1]) * 16;
  const em = raw.match(/^(-?[\d.]+)em$/i);
  if (em) return parseFloat(em[1]) * 16;
  const unitless = raw.match(/^(-?[\d.]+)$/);
  if (unitless) return parseFloat(unitless[1]);
  return null;
}

export function readUnitlessNumber(value: string): number | null {
  const m = value.trim().match(/^(-?[\d.]+)$/);
  return m ? parseFloat(m[1]) : null;
}

// Roles we expect any minimally complete type system to name. Missing ones
// come back as structural gaps. We match loosely on the token name.
const EXPECTED_ROLES: Array<{ role: string; patterns: RegExp[] }> = [
  { role: "h1 / display", patterns: [/h1/i, /display/i, /hero/i] },
  { role: "h2", patterns: [/h2/i] },
  { role: "h3", patterns: [/h3/i] },
  { role: "body", patterns: [/body(?!-)/i, /\bbase\b/i, /\btext\b/i, /\bmd\b/i] },
  { role: "body-sm / small", patterns: [/body-sm/i, /\bsm\b/i, /small/i] },
  { role: "caption / label", patterns: [/caption/i, /label/i, /\bxs\b/i] },
];

export function detectRoleGaps(sizeTokens: TypeToken[]): string[] {
  const names = sizeTokens.map((t) => t.name.toLowerCase());
  const gaps: string[] = [];
  for (const { role, patterns } of EXPECTED_ROLES) {
    const found = patterns.some((re) => names.some((n) => re.test(n)));
    if (!found) gaps.push(role);
  }
  return gaps;
}

export interface AuditFinding {
  severity: "error" | "warn" | "info";
  token: string;
  message: string;
}

export function auditSizeTokens(sizeTokens: TypeToken[]): AuditFinding[] {
  const findings: AuditFinding[] = [];
  let clampCount = 0;
  for (const t of sizeTokens) {
    const minPx = minPxFromSizeValue(t.value);
    const maxPx = maxPxFromSizeValue(t.value);
    if (/clamp\(/i.test(t.value)) clampCount++;
    if (minPx !== null && minPx < 12) {
      findings.push({
        severity: "error",
        token: t.name,
        message: `minimum resolves to ${minPx.toFixed(2)}px — below the 12px floor for legibility.`,
      });
    }
    if (minPx !== null && maxPx !== null && maxPx < minPx) {
      findings.push({
        severity: "error",
        token: t.name,
        message: `clamp max (${maxPx}px) is smaller than min (${minPx}px) — fluid scaling will invert on wide viewports.`,
      });
    }
  }
  if (sizeTokens.length > 0 && clampCount === 0) {
    findings.push({
      severity: "warn",
      token: "(all sizes)",
      message:
        "no clamp() or fluid values detected — scale is fixed. Fine for internal tools; consider fluid for marketing / content-wide layouts.",
    });
  }
  return findings;
}

export function auditLineHeightTokens(lhTokens: TypeToken[]): AuditFinding[] {
  const findings: AuditFinding[] = [];
  for (const t of lhTokens) {
    const n = readUnitlessNumber(t.value);
    if (n === null) continue;
    const isBodyish = /body|base|text|md|sm|paragraph/i.test(t.name);
    const isHeadingish = /h[1-6]|display|heading|hero/i.test(t.name);
    if (isBodyish && (n < 1.4 || n > 1.8)) {
      findings.push({
        severity: "warn",
        token: t.name,
        message: `line-height ${n} is outside the comfortable body range (1.4–1.8). Reader comprehension drops at both ends.`,
      });
    }
    if (isHeadingish && n > 1.3) {
      findings.push({
        severity: "warn",
        token: t.name,
        message: `line-height ${n} reads loose for a heading (>1.3). Hierarchy weakens when headings breathe as much as body.`,
      });
    }
    if (n < 1 || n > 2.2) {
      findings.push({
        severity: "error",
        token: t.name,
        message: `line-height ${n} is outside any sane range (< 1.0 clips; > 2.2 breaks rhythm).`,
      });
    }
  }
  return findings;
}

export function auditWeightTokens(weightTokens: TypeToken[]): AuditFinding[] {
  const findings: AuditFinding[] = [];
  for (const t of weightTokens) {
    const n = readUnitlessNumber(t.value);
    if (n === null) continue;
    if (n < 100 || n > 900 || n % 100 !== 0) {
      findings.push({
        severity: "warn",
        token: t.name,
        message: `weight ${n} is not a standard 100-step value (100…900). Some variable fonts support it, most don't.`,
      });
    }
  }
  return findings;
}

export function checkMandatedFamily(
  familyTokens: TypeToken[],
  css: string,
  mandatedFontFamily?: string,
): { status: "missing" | "present" | "not-required"; detail: string } {
  if (!mandatedFontFamily) return { status: "not-required", detail: "no mandated font specified" };
  const needle = mandatedFontFamily.toLowerCase();
  const anyTokenMatch = familyTokens.some((t) => t.value.toLowerCase().includes(needle));
  const anywhereMatch = css.toLowerCase().includes(needle);
  if (anyTokenMatch) {
    return {
      status: "present",
      detail: `mandated font "${mandatedFontFamily}" is referenced in a font-family token.`,
    };
  }
  if (anywhereMatch) {
    return {
      status: "present",
      detail: `mandated font "${mandatedFontFamily}" appears in the CSS, but not in a --font-family token — designers may want to promote it to a token.`,
    };
  }
  return {
    status: "missing",
    detail: `mandated font "${mandatedFontFamily}" is NOT referenced anywhere in the CSS you passed. Designer intent may have drifted; flag before proceeding.`,
  };
}
