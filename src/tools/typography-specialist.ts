import { z } from "zod";
import { defineTool, type TypeScaleData } from "./types.js";
import { composeRolePrompt } from "./loadPrompt.js";
import {
  auditLineHeightTokens,
  auditSizeTokens,
  auditWeightTokens,
  checkMandatedFamily,
  detectRoleGaps,
  parseTypeTokensFromCss,
  type AuditFinding,
  type TypeToken,
} from "./typography.js";

const DEFAULT_BASE = 16;
const DEFAULT_RATIO = 1.25; // major third — comfortable for UI

interface ScaleStep {
  role: string;
  weight: number;
  lineHeight: number | string;
  scaleFactor: number;
}

const STEPS: ScaleStep[] = [
  { role: "display", weight: 700, lineHeight: 1.05, scaleFactor: 4 },
  { role: "h1", weight: 700, lineHeight: 1.1, scaleFactor: 3 },
  { role: "h2", weight: 600, lineHeight: 1.15, scaleFactor: 2.25 },
  { role: "h3", weight: 600, lineHeight: 1.2, scaleFactor: 1.6 },
  { role: "h4", weight: 600, lineHeight: 1.3, scaleFactor: 1.25 },
  { role: "body-lg", weight: 400, lineHeight: 1.5, scaleFactor: 1.125 },
  { role: "body", weight: 400, lineHeight: 1.55, scaleFactor: 1 },
  { role: "body-sm", weight: 400, lineHeight: 1.5, scaleFactor: 0.875 },
  { role: "caption", weight: 500, lineHeight: 1.4, scaleFactor: 0.75 },
];

function clampForStep(basePx: number, scaleFactor: number): string {
  const minPx = Math.max(12, basePx * scaleFactor * 0.875);
  const maxPx = basePx * scaleFactor;
  const preferredVw = +(maxPx / 16 / 8).toFixed(3);
  const minRem = +(minPx / 16).toFixed(3);
  const maxRem = +(maxPx / 16).toFixed(3);
  return `clamp(${minRem}rem, ${minRem}rem + ${preferredVw}vw, ${maxRem}rem)`;
}

function buildTypeScale(basePx: number, ratio: number, name: string): TypeScaleData {
  return {
    name,
    scale: STEPS.map((step) => {
      const factor = step.scaleFactor === 1 ? 1 : step.scaleFactor * (ratio / DEFAULT_RATIO);
      return {
        role: step.role,
        clamp: clampForStep(basePx, factor),
        lineHeight: step.lineHeight,
        weight: step.weight,
      };
    }),
  };
}

function renderSeverity(s: AuditFinding["severity"]): string {
  return s === "error" ? "✗" : s === "warn" ? "⚠" : "·";
}

function renderFindings(findings: AuditFinding[]): string {
  if (findings.length === 0) return "_No issues flagged._";
  return findings
    .map((f) => `- ${renderSeverity(f.severity)} \`${f.token}\` — ${f.message}`)
    .join("\n");
}

function renderAuditBody(params: {
  tokens: TypeToken[];
  mandatedFontFamily?: string;
  css: string;
}): string {
  const { tokens, mandatedFontFamily, css } = params;
  if (tokens.length === 0) {
    return "The `existingTypeScale` you passed contained no parseable `--font-*` / `--line-height-*` / `--font-weight-*` / `--text-*` declarations. Double-check the CSS reached the tool intact.";
  }

  const sizeTokens = tokens.filter((t) => t.kind === "size");
  const lhTokens = tokens.filter((t) => t.kind === "lineHeight");
  const weightTokens = tokens.filter((t) => t.kind === "weight");
  const familyTokens = tokens.filter((t) => t.kind === "family");

  const lines: string[] = [];
  lines.push(
    `**Parsed ${tokens.length} token(s)** from your CSS — ${sizeTokens.length} size, ${lhTokens.length} line-height, ${weightTokens.length} weight, ${familyTokens.length} family.`,
  );
  lines.push("");

  lines.push("### Type tokens (parsed)");
  lines.push("");
  for (const t of tokens) {
    const scope = t.scope ? ` _(scope: ${t.scope})_` : "";
    lines.push(`- \`${t.name}\` · ${t.kind} · \`${t.value}\`${scope}`);
  }
  lines.push("");

  const sizeFindings = auditSizeTokens(sizeTokens);
  const lhFindings = auditLineHeightTokens(lhTokens);
  const weightFindings = auditWeightTokens(weightTokens);

  lines.push("### Size findings");
  lines.push("");
  lines.push(renderFindings(sizeFindings));
  lines.push("");

  lines.push("### Line-height findings");
  lines.push("");
  lines.push(renderFindings(lhFindings));
  lines.push("");

  lines.push("### Weight findings");
  lines.push("");
  lines.push(renderFindings(weightFindings));
  lines.push("");

  const gaps = detectRoleGaps(sizeTokens);
  lines.push("### Structural gaps (missing roles)");
  lines.push("");
  if (gaps.length === 0) {
    lines.push(
      "None obvious from naming alone. Confirm every UI surface (heading ladder + body + caption) has a named size token.",
    );
  } else {
    for (const g of gaps) lines.push(`- No token matching **${g}** — UI that needs this role will reach for an ad-hoc value.`);
  }
  lines.push("");

  const familyCheck = checkMandatedFamily(familyTokens, css, mandatedFontFamily);
  if (familyCheck.status !== "not-required") {
    lines.push("### Mandated font check");
    lines.push("");
    const symbol = familyCheck.status === "present" ? "✓" : "✗";
    lines.push(`- ${symbol} ${familyCheck.detail}`);
    lines.push("");
  }

  return lines.join("\n");
}

function emptyScale(name: string): TypeScaleData {
  return { name, scale: [] };
}

function tokensToScale(tokens: TypeToken[], name: string): TypeScaleData {
  return {
    name,
    scale: tokens
      .filter((t) => t.kind === "size")
      .map((t) => ({
        role: t.name.replace(/^--/, ""),
        clamp: t.value,
        lineHeight: "inherit",
        weight: "inherit",
      })),
  };
}

export const typographySpecialistTool = defineTool({
  name: "typography-specialist",
  title: "Typography Specialist",
  description:
    "Generates or audits a type scale. In generate mode: returns a fluid clamp() scale with line-heights and weights. In audit mode: parses your existing CSS tokens, flags sub-12px minimums, bad line-heights, non-standard weights, missing roles, and (optionally) a mandated-font-family drift.",
  inputSchema: {
    brief: z
      .string()
      .min(1)
      .describe("Product + tone. Editorial? Utilitarian? Tight or generous?"),
    baseSizePx: z
      .number()
      .optional()
      .describe("Base body size in px. Default 16."),
    ratio: z
      .number()
      .optional()
      .describe("Modular scale ratio. Default 1.25 (major third)."),
    mode: z
      .enum(["generate", "audit"])
      .optional()
      .describe(
        "'generate' (default) emits a fluid scale. 'audit' requires existingTypeScale and returns findings + role gaps instead of a fresh scale.",
      ),
    existingTypeScale: z
      .string()
      .optional()
      .describe(
        "Required for audit mode. Paste the CSS containing your `--font-size-*` / `--line-height-*` / `--font-weight-*` / `--text-*` declarations. Declarations inside selectors and at the top level are both parsed.",
      ),
    mandatedFontFamily: z
      .string()
      .optional()
      .describe(
        "Audit mode only: if the brand mandates a specific font (e.g., 'Satoshi'), the tool confirms it's referenced in the parsed CSS and flags drift if missing.",
      ),
  },
  outputKind: "type-scale",
  handler: ({ brief, baseSizePx, ratio, mode, existingTypeScale, mandatedFontFamily }) => {
    const isAudit = mode === "audit";

    if (isAudit) {
      const css = existingTypeScale?.trim();
      if (!css) {
        const text = composeRolePrompt({
          roleName: "Typography Specialist — Audit Mode",
          commandFile: "typography-specialist.md",
          sections: [
            { heading: "Designer's brief", body: brief },
            {
              heading: "Mode",
              body: "audit — but no `existingTypeScale` was passed. The tool cannot audit what it cannot see.",
            },
          ],
          closingInstruction:
            "Tell the designer audit mode requires `existingTypeScale`. Ask them to paste their type tokens CSS (or tailwind typography config translated to CSS vars). Do NOT generate a seed scale — that is generate mode.",
        });
        return { text, output: { type: "type-scale", data: emptyScale("audit-missing-input") } };
      }
      const tokens = parseTypeTokensFromCss(css);
      const auditBody = renderAuditBody({ tokens, mandatedFontFamily, css });
      const scaleName = `audit-${tokens.length}-tokens`;
      const data = tokensToScale(tokens, scaleName);
      const text = composeRolePrompt({
        roleName: "Typography Specialist — Audit Mode",
        commandFile: "typography-specialist.md",
        sections: [
          { heading: "Designer's brief", body: brief },
          { heading: "Mode", body: "audit — no fresh scale will be generated." },
          {
            heading: "Mandated font family",
            body: mandatedFontFamily ?? "not provided — skipping mandated-font check.",
          },
          { heading: "Audit result (server-computed)", body: auditBody },
        ],
        closingInstruction:
          "Respond with a senior-typographer audit of the existing scale. Lead with severity-ordered findings (errors first, then warnings, then missing roles). For each finding, state WHERE in a typical UI the issue surfaces and WHAT to change. Do NOT emit a fresh clamp() scale — the designer has tokens; your job is to make them honest, not replace them. If the mandated font is missing, flag that before anything else.",
      });
      return { text, output: { type: "type-scale", data } };
    }

    const base = baseSizePx ?? DEFAULT_BASE;
    const r = ratio ?? DEFAULT_RATIO;
    const scale = buildTypeScale(base, r, `type-scale-${base}-${r}`);

    const scaleTable = scale.scale
      .map(
        (s) =>
          `- \`${s.role}\` · ${s.clamp} · weight ${s.weight} · line-height ${s.lineHeight}`,
      )
      .join("\n");

    const text = composeRolePrompt({
      roleName: "Typography Specialist",
      commandFile: "typography-specialist.md",
      sections: [
        { heading: "Designer's brief", body: brief },
        { heading: "Base size", body: `${base}px` },
        { heading: "Modular ratio", body: `${r}` },
        {
          heading: "Seed type scale (generated by the MCP server)",
          body: `${scaleTable}\n\nAll sizes use clamp() for fluid scaling. Adjust if the brief wants tighter or looser hierarchy.`,
        },
      ],
      closingInstruction:
        "Respond with a refined type system: font family recommendation(s), pairings, when to use each role, and any vertical-rhythm adjustments. Keep body line-height in the 1.5–1.65 range for readability unless the brief overrides.",
    });

    return {
      text,
      output: { type: "type-scale", data: scale },
    };
  },
});
