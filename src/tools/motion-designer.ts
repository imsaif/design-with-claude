import { z } from "zod";
import { defineTool } from "./types.js";
import { composeRolePrompt } from "./loadPrompt.js";
import { runMotionAudit, type MotionFinding } from "./motion.js";

function renderSeverity(s: MotionFinding["severity"]): string {
  return s === "error" ? "✗" : s === "warn" ? "⚠" : "·";
}

function renderFindings(findings: MotionFinding[]): string {
  if (findings.length === 0) return "_No issues flagged in this pass._";
  return findings
    .map((f) => `- ${renderSeverity(f.severity)} \`${f.element}\` — ${f.message}`)
    .join("\n");
}

function renderAuditBody(css: string): string {
  const trimmed = css.trim();
  if (!trimmed) {
    return "The `existingCss` you passed was empty. Paste the CSS containing your transitions/animations/@keyframes so the audit has something to inspect.";
  }
  const findings = runMotionAudit(trimmed);
  const errors = findings.filter((f) => f.severity === "error");
  const warns = findings.filter((f) => f.severity === "warn");
  const infos = findings.filter((f) => f.severity === "info");

  const lines: string[] = [];
  lines.push(
    `**Parsed ${trimmed.length} char(s) of CSS.** Flagged ${errors.length} error(s), ${warns.length} warning(s), ${infos.length} info note(s). Audit focuses on motion-specific patterns: reduced-motion support, duration bounds, transition: all, animated layout props, infinite loops, easing.`,
  );
  lines.push("");

  lines.push("### Errors (accessibility / inclusion blockers)");
  lines.push("");
  lines.push(renderFindings(errors));
  lines.push("");

  lines.push("### Warnings (UX + performance risk)");
  lines.push("");
  lines.push(renderFindings(warns));
  lines.push("");

  lines.push("### Info (style calls worth confirming)");
  lines.push("");
  lines.push(renderFindings(infos));
  lines.push("");

  return lines.join("\n");
}

export const motionDesignerTool = defineTool({
  name: "motion-designer",
  title: "Motion Designer",
  description:
    "Designs or audits motion. In audit mode: parses pasted CSS for missing `prefers-reduced-motion` support, runaway durations, animated layout properties, `transition: all`, unstoppable infinite loops, mechanical easing. In generate mode: returns a motion spec tailored to the brief.",
  inputSchema: {
    brief: z
      .string()
      .min(1)
      .describe(
        "What motion are you designing or auditing? Describe surfaces (hover, page transition, modal, loading), intent (affirmation, guidance, feedback), and any brand constraints.",
      ),
    mode: z
      .enum(["generate", "audit"])
      .optional()
      .describe(
        "'generate' (default) returns a motion spec. 'audit' requires existingCss and returns server-computed findings.",
      ),
    existingCss: z
      .string()
      .optional()
      .describe(
        "Audit mode input. Paste CSS containing `transition`, `animation`, `@keyframes`, or `@media (prefers-reduced-motion)` rules.",
      ),
  },
  outputKind: "markdown",
  handler: ({ brief, mode, existingCss }) => {
    const isAudit = mode === "audit";

    if (isAudit) {
      const css = existingCss ?? "";
      const auditBody = renderAuditBody(css);
      const text = composeRolePrompt({
        roleName: "Motion Designer — Audit Mode",
        commandFile: "motion-designer.md",
        sections: [
          { heading: "Designer's brief", body: brief },
          { heading: "Mode", body: "audit — no fresh motion spec will be generated." },
          { heading: "Audit result (server-computed)", body: auditBody },
        ],
        closingInstruction:
          "Respond as a senior motion designer. Lead with errors (reduced-motion is non-negotiable), then warnings (perf + UX), then info. For each finding, state the exact CSS fix (property + value). Do NOT propose a fresh motion language — the designer has one; your job is to make it inclusive and performant.",
      });
      return {
        text,
        output: {
          type: "markdown",
          data: {
            title: "Motion audit",
            content: auditBody,
          },
        },
      };
    }

    const text = composeRolePrompt({
      roleName: "Motion Designer",
      commandFile: "motion-designer.md",
      sections: [{ heading: "Designer's brief", body: brief }],
      closingInstruction:
        "Produce a motion spec. Cover: (1) durations (micro 100–200ms, standard 200–300ms, large 300–500ms), (2) easing tokens with intent (enter = ease-out, exit = ease-in, emphasis = cubic-bezier), (3) which properties animate (transform + opacity only), (4) `prefers-reduced-motion` fallback strategy, (5) surface-by-surface choreography (hover, focus, modal, page transition).",
    });
    return {
      text,
      output: {
        type: "markdown",
        data: {
          title: "Motion spec",
          content: `**Brief:** ${brief}`,
        },
      },
    };
  },
});
