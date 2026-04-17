import { z } from "zod";
import { defineTool } from "./types.js";
import { composeRolePrompt } from "./loadPrompt.js";
import {
  buildNeutralRamp,
  buildPrimaryRamp,
  buildSemanticColors,
  classifyContrast,
  contrastRatio,
  parseTokensFromCss,
} from "./color.js";
import type { PaletteData } from "./types.js";

const DEFAULT_ACCENT = "#5B8DEF";
const WHITE = "#ffffff";
const NEAR_BLACK = "#121212";

type SeedToken = PaletteData["tokens"][number];

function buildSeedPalette(accentHex: string, name: string): PaletteData {
  const primary = buildPrimaryRamp(accentHex);
  const neutral = buildNeutralRamp(accentHex);
  const semantic = buildSemanticColors();
  const tokens: SeedToken[] = [
    ...primary.map((p) => ({
      name: `--color-primary-${p.step}`,
      hex: p.hex,
      role: p.step === 500 ? "primary base (mandated if accent was provided)" : `primary ${p.step}`,
    })),
    ...neutral.map((n) => ({
      name: `--color-neutral-${n.step}`,
      hex: n.hex,
      role: n.step === 500 ? "neutral base" : `neutral ${n.step}`,
    })),
    ...semantic.map((s) => ({
      name: `--color-${s.role}`,
      hex: s.hex,
      role: s.role,
    })),
  ];
  return { name, tokens };
}

function verdict(c: ReturnType<typeof classifyContrast>): string {
  const parts: string[] = [];
  parts.push(c.aaBody ? "AA body ✓" : "AA body ✗");
  parts.push(c.aaLarge ? "AA large/UI ✓" : "AA large/UI ✗");
  if (c.aaaBody) parts.push("AAA ✓");
  return parts.join(" · ");
}

function renderContrastRow(token: { name: string; hex: string; role: string }): string {
  const onWhite = classifyContrast(contrastRatio(token.hex, WHITE));
  const onBlack = classifyContrast(contrastRatio(token.hex, NEAR_BLACK));
  return `- \`${token.name}\` · ${token.hex} · ${token.role}\n  · on #FFFFFF: ${onWhite.ratio.toFixed(2)}:1 — ${verdict(onWhite)}\n  · on #121212: ${onBlack.ratio.toFixed(2)}:1 — ${verdict(onBlack)}`;
}

function detectStructuralGaps(tokens: Array<{ name: string }>): string[] {
  const names = tokens.map((t) => t.name.toLowerCase());
  const gaps: string[] = [];
  const hasAny = (substr: string) => names.some((n) => n.includes(substr));
  if (!hasAny("primary") && !hasAny("accent") && !hasAny("brand"))
    gaps.push("No primary/accent/brand-named token — semantic roles can't be traced back to a brand color.");
  if (!hasAny("neutral") && !hasAny("gray") && !hasAny("grey") && !hasAny("surface") && !hasAny("text"))
    gaps.push("No neutral/gray ramp — body text, borders, and surfaces need a dedicated neutral scale.");
  if (!hasAny("success") && !hasAny("positive"))
    gaps.push("No success/positive semantic — state feedback is incomplete without it.");
  if (!hasAny("warning") && !hasAny("caution"))
    gaps.push("No warning/caution semantic — state feedback is incomplete without it.");
  if (!hasAny("danger") && !hasAny("error") && !hasAny("destructive"))
    gaps.push("No danger/error/destructive semantic — state feedback is incomplete without it.");
  const hasPrimitive = names.some((n) => /-(50|100|200|300|400|500|600|700|800|900|950)$/.test(n));
  if (!hasPrimitive)
    gaps.push("No stepped scale (50–900) detected — tokens read as semantic-only, no primitive layer. Fine for small systems; add a primitive layer if multi-theme or dark mode lands.");
  return gaps;
}

function renderAuditBody(params: {
  tokens: Array<{ name: string; hex: string; scope?: string }>;
  mandatedAccent?: string;
  surfaces: string[];
}): string {
  const { tokens, mandatedAccent, surfaces } = params;
  if (tokens.length === 0) {
    return "The `existingTokensCss` you passed contained no parseable `--<name>: <hex|rgb>` declarations. Double-check the CSS reached the tool intact.";
  }

  const lines: string[] = [];
  lines.push(`**Parsed ${tokens.length} token(s) from your CSS.** Contrast computed server-side against your requested surfaces.`);
  lines.push("");

  lines.push(`### Contrast matrix (token × surface)`);
  lines.push("");
  const header = ["Token", "Hex", ...surfaces.map((s) => `on ${s}`)].join(" | ");
  const sep = ["---", "---", ...surfaces.map(() => "---")].join(" | ");
  lines.push(header);
  lines.push(sep);
  const failingPairs: Array<{ token: string; hex: string; surface: string; ratio: number }> = [];
  for (const t of tokens) {
    const cells = [t.name, t.hex];
    for (const surface of surfaces) {
      const c = classifyContrast(contrastRatio(t.hex, surface));
      cells.push(`${c.ratio.toFixed(2)}:1 · ${verdict(c)}`);
      if (!c.aaBody && !c.aaLarge) {
        failingPairs.push({ token: t.name, hex: t.hex, surface, ratio: c.ratio });
      }
    }
    lines.push(cells.join(" | "));
  }
  lines.push("");

  if (failingPairs.length > 0) {
    lines.push(`### Failing pairings (below AA large/UI 3:1)`);
    lines.push("");
    for (const f of failingPairs) {
      lines.push(`- \`${f.token}\` (${f.hex}) on \`${f.surface}\` → ${f.ratio.toFixed(2)}:1 — unsafe for any text or non-text UI role.`);
    }
    lines.push("");
  } else {
    lines.push(`### Failing pairings`);
    lines.push("");
    lines.push("None below 3:1. Still inspect body-text pairings (< 4.5:1) in the matrix above.");
    lines.push("");
  }

  const gaps = detectStructuralGaps(tokens);
  lines.push(`### Structural gaps`);
  lines.push("");
  if (gaps.length === 0) {
    lines.push("None obvious from naming alone. Review the matrix for coverage gaps (e.g. no token earning AA body on white).");
  } else {
    for (const g of gaps) lines.push(`- ${g}`);
  }
  lines.push("");

  if (mandatedAccent) {
    const inPalette = tokens.find((t) => t.hex.toLowerCase() === mandatedAccent.toLowerCase());
    lines.push(`### Mandated accent check`);
    lines.push("");
    if (inPalette) {
      lines.push(`- Mandated accent \`${mandatedAccent}\` is present as \`${inPalette.name}\`. ✓`);
    } else {
      lines.push(`- Mandated accent \`${mandatedAccent}\` is **not** present among the parsed tokens. Designer intent may have drifted; flag and confirm before proceeding.`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

export const colorSpecialistTool = defineTool({
  name: "color-specialist",
  title: "Color Specialist",
  description:
    "Generates or audits color palettes. In generate mode: returns primary + neutral + semantic ramps with server-computed WCAG contrast. In audit mode: parses your existing CSS tokens, computes a contrast matrix against the surfaces you name, and flags failing pairings + structural gaps — no fresh seed.",
  inputSchema: {
    brief: z
      .string()
      .min(1)
      .describe("Describe the product, mood, and any color constraints."),
    accent: z
      .string()
      .optional()
      .describe(
        "Optional accent color as hex (e.g. '#5B8DEF'). When provided, primary-500 is pinned to this exact hex (brand-mandate preservation).",
      ),
    mode: z
      .enum(["generate", "audit"])
      .optional()
      .describe(
        "'generate' (default) emits a seed ramp. 'audit' requires existingTokensCss and returns a contrast matrix + gap list instead of a fresh seed.",
      ),
    existingTokensCss: z
      .string()
      .optional()
      .describe(
        "Required for audit mode. Paste the CSS containing your `--color-*: <hex|rgb>` declarations (e.g. the body of themes.css). Declarations inside selector blocks and at the top level are both parsed.",
      ),
    surfaces: z
      .array(z.string())
      .optional()
      .describe(
        "Audit mode only: hex surfaces to audit each token against. Defaults to ['#FFFFFF', '#121212'] if omitted.",
      ),
    targetMode: z
      .enum(["light", "dark", "both"])
      .optional()
      .describe("Output target for generate mode. Defaults to 'both'."),
  },
  outputKind: "palette",
  handler: ({ brief, accent, mode, existingTokensCss, surfaces, targetMode }) => {
    const isAudit = mode === "audit";

    if (isAudit) {
      const css = existingTokensCss?.trim();
      if (!css) {
        // Return a soft-fail payload so Claude explains the gap to the designer
        // instead of the MCP layer throwing. The palette is empty on purpose.
        const emptyPalette: PaletteData = { name: "audit-missing-input", tokens: [] };
        const text = composeRolePrompt({
          roleName: "Color Specialist — Audit Mode",
          commandFile: "color-specialist.md",
          sections: [
            { heading: "Designer's brief", body: brief },
            {
              heading: "Mode",
              body: "audit — but no `existingTokensCss` was passed. The tool cannot audit what it cannot see.",
            },
          ],
          closingInstruction:
            "Tell the designer audit mode requires `existingTokensCss`. Ask them to paste the contents of their themes.css (or equivalent) and retry. Do not generate a seed palette — that is generate mode.",
        });
        return { text, output: { type: "palette", data: emptyPalette } };
      }
      const parsedTokens = parseTokensFromCss(css);
      const auditSurfaces = surfaces && surfaces.length > 0 ? surfaces : [WHITE, NEAR_BLACK];
      const auditBody = renderAuditBody({
        tokens: parsedTokens,
        mandatedAccent: accent,
        surfaces: auditSurfaces,
      });
      const paletteName = `audit-${parsedTokens.length}-tokens`;
      const palette: PaletteData = {
        name: paletteName,
        tokens: parsedTokens.map((t) => ({
          name: t.name,
          hex: t.hex,
          role: t.scope ? `existing (${t.scope})` : "existing",
        })),
      };
      const text = composeRolePrompt({
        roleName: "Color Specialist — Audit Mode",
        commandFile: "color-specialist.md",
        sections: [
          { heading: "Designer's brief", body: brief },
          { heading: "Mode", body: "audit — no fresh palette will be generated." },
          {
            heading: "Mandated accent",
            body: accent ?? "not provided — skipping mandated-accent check.",
          },
          { heading: "Surfaces audited against", body: auditSurfaces.join(", ") },
          { heading: "Audit result (server-computed)", body: auditBody },
        ],
        closingInstruction:
          "Respond with a senior-designer audit of the existing palette. Lead with severity-ordered findings (contrast fails first, then structural gaps, then minor suggestions). For each failing pairing, state WHERE in a typical UI it would appear and WHAT to swap to. Do NOT emit a fresh primary ramp — the designer has a palette; your job is to make it honest, not replace it. If the mandated accent is missing from the parsed tokens, flag that before anything else.",
      });
      return { text, output: { type: "palette", data: palette } };
    }

    // Generate mode (default) — now with contrast annotations.
    const accentHex = accent?.trim() || DEFAULT_ACCENT;
    const paletteName = `palette-${accentHex.replace("#", "").slice(0, 6)}`;
    const palette = buildSeedPalette(accentHex, paletteName);
    const seedTable = palette.tokens.map(renderContrastRow).join("\n");

    const text = composeRolePrompt({
      roleName: "Color Specialist",
      commandFile: "color-specialist.md",
      sections: [
        { heading: "Designer's brief", body: brief },
        { heading: "Target mode", body: targetMode ?? "both" },
        {
          heading: "Accent",
          body:
            accentHex === DEFAULT_ACCENT
              ? "not provided — using default #5B8DEF"
              : `${accentHex} — pinned as primary-500 exactly (mandated brand hex).`,
        },
        {
          heading: "Seed palette with server-computed WCAG contrast",
          body: `${seedTable}\n\nEvery token above carries its contrast ratio against #FFFFFF and #121212. Trust these numbers — they were computed by the tool, not estimated. Refine the palette against the brief, but keep the contrast math.`,
        },
      ],
      closingInstruction:
        "Respond with a refined palette. For each token: name, hex, intended role, and the pairings that meet WCAG AA (4.5:1 body, 3:1 large/UI). The contrast numbers above are your source of truth — cite them, don't recompute. Call out any failing pairings in plain language. If the brief implies a mood (calm, urgent, premium), justify the primary hue choice.",
    });

    return {
      text,
      output: { type: "palette", data: palette },
    };
  },
});
