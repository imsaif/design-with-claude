// Browser-side mirror of src/tools/color.ts audit helpers — the subset the
// landing demo needs. Keep in sync with the MCP-side source of truth; the
// intent is that the demo runs the SAME regex + contrast math as the real
// tool so what visitors see is what designers get.

function channelLuminance(srgb: number): number {
  return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
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
  aaBody: boolean;
  aaLarge: boolean;
  aaaBody: boolean;
}

export function classifyContrast(ratio: number): ContrastClassification {
  return {
    ratio,
    aaBody: ratio >= 4.5,
    aaLarge: ratio >= 3,
    aaaBody: ratio >= 7,
  };
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

export interface ColorToken {
  name: string;
  hex: string;
  scope?: string;
}

export function parseTokensFromCss(css: string): ColorToken[] {
  const tokens: ColorToken[] = [];
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
  return tokens;
}

export function verdict(c: ContrastClassification): string {
  const parts: string[] = [];
  parts.push(c.aaBody ? "AA body ✓" : "AA body ✗");
  parts.push(c.aaLarge ? "AA large/UI ✓" : "AA large/UI ✗");
  if (c.aaaBody) parts.push("AAA ✓");
  return parts.join(" · ");
}
