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
  const { h, s } = hexToHsl(accentHex);
  const saturation = Math.max(0.35, Math.min(0.85, s));
  const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
  const lightness = [0.97, 0.93, 0.85, 0.73, 0.6, 0.5, 0.42, 0.33, 0.24, 0.16];
  return steps.map((step, i) => ({
    step,
    hex: hslToHex({ h, s: saturation, l: lightness[i] }),
  }));
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
