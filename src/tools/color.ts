type Hsl = { h: number; s: number; l: number };

export function hexToHsl(hex: string): Hsl {
  const m = hex.replace("#", "").match(/^([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/);
  if (!m) throw new Error(`Invalid hex color: ${hex}`);
  let h6 = m[1];
  if (h6.length === 3) h6 = h6.split("").map((c) => c + c).join("");
  const r = parseInt(h6.slice(0, 2), 16) / 255;
  const g = parseInt(h6.slice(2, 4), 16) / 255;
  const b = parseInt(h6.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }
  return { h, s, l };
}

export function hslToHex({ h, s, l }: Hsl): string {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function buildPrimaryRamp(accentHex: string): Array<{ step: number; hex: string }> {
  const { h, s, l } = hexToHsl(accentHex);
  const saturation = Math.max(0.35, Math.min(0.85, s));
  const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
  // Step 500 is ALWAYS the exact accent — lift toward 0.97 for lighter steps,
  // darken toward 0.12 for darker steps. Prior versions forced L=0.5 at step
  // 500 which silently shifted mandated brand hexes (e.g. navy #1F3B90 → #2d56d2).
  const lightUpper = 0.97;
  const darkLower = 0.12;
  const lightRatios = [1, 0.82, 0.62, 0.4, 0.2]; // 50, 100, 200, 300, 400
  const darkRatios = [0.22, 0.45, 0.65, 0.8]; // 600, 700, 800, 900
  return steps.map((step, i) => {
    if (step === 500) return { step, hex: accentHex.startsWith("#") ? accentHex : `#${accentHex}` };
    const mix = step < 500 ? lightRatios[i] : darkRatios[i - 6];
    const targetL = step < 500 ? l + (lightUpper - l) * mix : l - (l - darkLower) * mix;
    return { step, hex: hslToHex({ h, s: saturation, l: targetL }) };
  });
}

// WCAG 2.1 relative luminance — https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
function channelLuminance(srgb: number): number {
  return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string): number {
  const m = hex.replace("#", "").match(/^([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/);
  if (!m) throw new Error(`Invalid hex color: ${hex}`);
  let h6 = m[1];
  if (h6.length === 3) h6 = h6.split("").map((c) => c + c).join("");
  const r = channelLuminance(parseInt(h6.slice(0, 2), 16) / 255);
  const g = channelLuminance(parseInt(h6.slice(2, 4), 16) / 255);
  const b = channelLuminance(parseInt(h6.slice(4, 6), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(hexA: string, hexB: string): number {
  const la = relativeLuminance(hexA);
  const lb = relativeLuminance(hexB);
  const [lighter, darker] = la > lb ? [la, lb] : [lb, la];
  return (lighter + 0.05) / (darker + 0.05);
}

export interface ContrastClassification {
  ratio: number;
  aaBody: boolean; // 4.5:1
  aaLarge: boolean; // 3:1 — text ≥24px or ≥18.66px bold
  aaNonText: boolean; // 3:1 — UI components and graphical objects
  aaaBody: boolean; // 7:1
  aaaLarge: boolean; // 4.5:1
}

export function classifyContrast(ratio: number): ContrastClassification {
  return {
    ratio,
    aaBody: ratio >= 4.5,
    aaLarge: ratio >= 3,
    aaNonText: ratio >= 3,
    aaaBody: ratio >= 7,
    aaaLarge: ratio >= 4.5,
  };
}

// Parses CSS text for `--color-*: <value>` declarations, normalizing to hex.
// Accepts #rgb / #rrggbb and rgb()/rgba() forms. Ignores hsl() and var() refs
// for now — those need a resolution step we can add once there's a caller need.
export function parseTokensFromCss(
  css: string,
): Array<{ name: string; hex: string; scope?: string }> {
  const tokens: Array<{ name: string; hex: string; scope?: string }> = [];
  // Split into selector blocks so we can capture scope (e.g. `html[data-theme="dark"]`).
  const blockRe = /([^{}]+)\{([^}]*)\}/g;
  let blockMatch: RegExpExecArray | null;
  while ((blockMatch = blockRe.exec(css)) !== null) {
    const selector = blockMatch[1].trim();
    const body = blockMatch[2];
    const declRe = /(--[a-zA-Z0-9-_]+)\s*:\s*([^;]+);/g;
    let declMatch: RegExpExecArray | null;
    while ((declMatch = declRe.exec(body)) !== null) {
      const name = declMatch[1];
      const raw = declMatch[2].trim();
      const hex = normalizeToHex(raw);
      if (hex) tokens.push({ name, hex, scope: selector === ":root" ? undefined : selector });
    }
  }
  // Also catch declarations outside any block (rare, but happens in snippets).
  const flatBody = css.replace(blockRe, "");
  const declRe = /(--[a-zA-Z0-9-_]+)\s*:\s*([^;]+);/g;
  let declMatch: RegExpExecArray | null;
  while ((declMatch = declRe.exec(flatBody)) !== null) {
    const name = declMatch[1];
    const raw = declMatch[2].trim();
    const hex = normalizeToHex(raw);
    if (hex) tokens.push({ name, hex });
  }
  return tokens;
}

function normalizeToHex(raw: string): string | null {
  const hexMatch = raw.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (hexMatch) {
    let h = hexMatch[1];
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    return `#${h.toLowerCase()}`;
  }
  const rgbMatch = raw.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)(?:[\s,/]+([\d.]+%?))?\s*\)$/);
  if (rgbMatch) {
    const r = Math.max(0, Math.min(255, parseInt(rgbMatch[1], 10)));
    const g = Math.max(0, Math.min(255, parseInt(rgbMatch[2], 10)));
    const b = Math.max(0, Math.min(255, parseInt(rgbMatch[3], 10)));
    return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
  }
  return null;
}

export function buildNeutralRamp(accentHex: string): Array<{ step: number; hex: string }> {
  const { h } = hexToHsl(accentHex);
  const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
  const lightness = [0.98, 0.95, 0.9, 0.82, 0.66, 0.48, 0.36, 0.26, 0.17, 0.1];
  return steps.map((step, i) => ({
    step,
    hex: hslToHex({ h, s: 0.04, l: lightness[i] }),
  }));
}

export const SEMANTIC_HUES = {
  success: 150,
  warning: 38,
  danger: 2,
  info: 210,
} as const;

export function buildSemanticColors(): Array<{ role: string; hex: string }> {
  return (Object.entries(SEMANTIC_HUES) as Array<[keyof typeof SEMANTIC_HUES, number]>).map(
    ([role, hue]) => ({
      role,
      hex: hslToHex({ h: hue, s: 0.65, l: 0.5 }),
    }),
  );
}
