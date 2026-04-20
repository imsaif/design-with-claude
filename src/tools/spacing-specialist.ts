import { z } from "zod";
import { defineTool, type SpacingData } from "./types.js";
import { composeRolePrompt } from "./loadPrompt.js";
import {
  auditSpacingTokens,
  detectStepGaps,
  inferBaseUnit,
  parseSpacingTokensFromCss,
  type SpacingFinding,
  type SpacingToken,
} from "./spacing.js";

const DEFAULT_BASE = 4;
const STEPS = [
  { name: "0", multiplier: 0 },
  { name: "0.5", multiplier: 0.5 },
  { name: "1", multiplier: 1 },
  { name: "2", multiplier: 2 },
  { name: "3", multiplier: 3 },
  { name: "4", multiplier: 4 },
  { name: "5", multiplier: 6 },
  { name: "6", multiplier: 8 },
  { name: "7", multiplier: 12 },
  { name: "8", multiplier: 16 },
  { name: "9", multiplier: 24 },
  { name: "10", multiplier: 32 },
];

function buildSpacingScale(basePx: number, name: string): SpacingData {
  return {
    name,
    steps: STEPS.map((s) => {
      const px = basePx * s.multiplier;
      return {
        name: `space-${s.name}`,
        px,
        rem: +(px / 16).toFixed(4),
      };
    }),
  };
}

function renderSeverity(s: SpacingFinding["severity"]): string {
  return s === "error" ? "✗" : s === "warn" ? "⚠" : "·";
}

function renderFindings(findings: SpacingFinding[]): string {
  if (findings.length === 0) return "_No issues flagged._";
  return findings
    .map((f) => `- ${renderSeverity(f.severity)} \`${f.token}\` — ${f.message}`)
    .join("\n");
}

function renderAuditBody(params: {
  tokens: SpacingToken[];
  baseUnitPx: number | undefined;
}): string {
  const { tokens, baseUnitPx } = params;
  if (tokens.length === 0) {
    return "The `existingSpacingTokens` you passed contained no parseable `--space-*` / `--spacing-*` / `--gap-*` declarations. Double-check the CSS reached the tool intact.";
  }

  const inferred = inferBaseUnit(tokens);
  const base = baseUnitPx ?? inferred ?? 4;
  const findings = auditSpacingTokens(tokens, base);
  const gaps = detectStepGaps(tokens);

  const lines: string[] = [];
  lines.push(
    `**Parsed ${tokens.length} spacing token(s)** from your CSS. Inferred base unit: **${
      inferred ?? "?"
    }px**${baseUnitPx ? ` · designer-specified: ${baseUnitPx}px` : ""}.`,
  );
  lines.push("");

  lines.push("### Spacing tokens (parsed)");
  lines.push("");
  for (const t of tokens) {
    const scope = t.scope ? ` _(scope: ${t.scope})_` : "";
    const pxLabel = t.px !== null ? `${t.px}px` : "_unparseable_";
    lines.push(`- \`${t.name}\` · \`${t.value}\` → ${pxLabel}${scope}`);
  }
  lines.push("");

  lines.push(`### Findings (base unit ${base}px)`);
  lines.push("");
  lines.push(renderFindings(findings));
  lines.push("");

  lines.push("### Structural gaps (missing steps)");
  lines.push("");
  if (gaps.length === 0) {
    lines.push(
      "None obvious from naming alone. Confirm each UI density case (card padding, section padding, input padding) has a token it maps to.",
    );
  } else {
    for (const g of gaps) lines.push(`- No token matching **${g}** — density cases in this range will reach for ad-hoc values.`);
  }
  lines.push("");

  return lines.join("\n");
}

function tokensToSpacingData(tokens: SpacingToken[], name: string): SpacingData {
  return {
    name,
    steps: tokens
      .filter((t) => t.px !== null)
      .map((t) => ({
        name: t.name.replace(/^--/, ""),
        px: t.px as number,
        rem: +(((t.px as number) / 16).toFixed(4)),
      })),
  };
}

export const spacingSpecialistTool = defineTool({
  name: "spacing-specialist",
  title: "Spacing & Layout Specialist",
  description:
    "Generates or audits a spacing scale. In generate mode: returns non-linear --space-* tokens and layout rhythm. In audit mode: parses your existing spacing CSS, infers the base unit, flags off-grid values and big step-jumps, and lists missing common steps.",
  inputSchema: {
    brief: z
      .string()
      .min(1)
      .describe("Product + density intent. Dashboard? Marketing? Forms-heavy?"),
    baseUnitPx: z
      .number()
      .optional()
      .describe("Base unit in px. Default 4. In audit mode, overrides the inferred base."),
    mode: z
      .enum(["generate", "audit"])
      .optional()
      .describe(
        "'generate' (default) emits a seed scale. 'audit' requires existingSpacingTokens and returns findings + gap list instead of a fresh scale.",
      ),
    existingSpacingTokens: z
      .string()
      .optional()
      .describe(
        "Required for audit mode. Paste the CSS containing your `--space-*` / `--spacing-*` / `--gap-*` declarations. Declarations inside selectors and at the top level are both parsed.",
      ),
  },
  outputKind: "spacing",
  handler: ({ brief, baseUnitPx, mode, existingSpacingTokens }) => {
    const isAudit = mode === "audit";

    if (isAudit) {
      const css = existingSpacingTokens?.trim();
      if (!css) {
        const text = composeRolePrompt({
          roleName: "Spacing & Layout Specialist — Audit Mode",
          commandFile: "spacing-layout-specialist.md",
          sections: [
            { heading: "Designer's brief", body: brief },
            {
              heading: "Mode",
              body: "audit — but no `existingSpacingTokens` was passed. The tool cannot audit what it cannot see.",
            },
          ],
          closingInstruction:
            "Tell the designer audit mode requires `existingSpacingTokens`. Ask them to paste their spacing CSS. Do NOT generate a seed scale — that is generate mode.",
        });
        return { text, output: { type: "spacing", data: { name: "audit-missing-input", steps: [] } } };
      }
      const tokens = parseSpacingTokensFromCss(css);
      const auditBody = renderAuditBody({ tokens, baseUnitPx });
      const data = tokensToSpacingData(tokens, `audit-${tokens.length}-tokens`);
      const text = composeRolePrompt({
        roleName: "Spacing & Layout Specialist — Audit Mode",
        commandFile: "spacing-layout-specialist.md",
        sections: [
          { heading: "Designer's brief", body: brief },
          { heading: "Mode", body: "audit — no fresh scale will be generated." },
          {
            heading: "Base unit",
            body:
              baseUnitPx !== undefined
                ? `${baseUnitPx}px (designer-specified)`
                : `inferred from parsed tokens`,
          },
          { heading: "Audit result (server-computed)", body: auditBody },
        ],
        closingInstruction:
          "Respond with a senior-designer audit of the existing spacing system. Lead with severity-ordered findings (off-grid values first, then step-jumps, then missing steps). For each finding, state WHERE in a typical UI the issue surfaces (card padding, section padding, stack gap) and WHAT value to swap to. Do NOT emit a fresh --space-* ramp — the designer has tokens; your job is to make them consistent, not replace them.",
      });
      return { text, output: { type: "spacing", data } };
    }

    const base = baseUnitPx ?? DEFAULT_BASE;
    const scale = buildSpacingScale(base, `spacing-${base}px`);

    const table = scale.steps
      .map((s) => `- \`--${s.name}\` · ${s.px}px · ${s.rem}rem`)
      .join("\n");

    const text = composeRolePrompt({
      roleName: "Spacing & Layout Specialist",
      commandFile: "spacing-layout-specialist.md",
      sections: [
        { heading: "Designer's brief", body: brief },
        { heading: "Base unit", body: `${base}px` },
        {
          heading: "Seed spacing scale (generated by the MCP server)",
          body: `${table}\n\nNon-linear steps (0.5, 1, 2, 3, 4, 6, 8, 12, 16, 24, 32) to preserve rhythm without bloat. Adjust density to match the brief.`,
        },
      ],
      closingInstruction:
        "Respond with: (1) recommended spacing tokens and when to use each, (2) grid / container widths, (3) section padding presets (compact/default/generous), (4) component-level conventions (card, button, input padding).",
    });

    return {
      text,
      output: { type: "spacing", data: scale },
    };
  },
});
