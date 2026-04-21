import { z } from "zod";
import { defineTool } from "./types.js";
import { composeRolePrompt } from "./loadPrompt.js";
import { runA11yAudit, type A11yFinding } from "./accessibility.js";
import { classifyContrast, contrastRatio } from "./color.js";

function renderSeverity(s: A11yFinding["severity"]): string {
  return s === "error" ? "✗" : s === "warn" ? "⚠" : "·";
}

function renderFindings(findings: A11yFinding[]): string {
  if (findings.length === 0) return "_No issues flagged in this pass._";
  return findings
    .map((f) => `- ${renderSeverity(f.severity)} \`${f.element}\` — ${f.message}`)
    .join("\n");
}

function renderContrastCheck(foreground?: string, background?: string): string | null {
  if (!foreground || !background) return null;
  const ratio = contrastRatio(foreground, background);
  const c = classifyContrast(ratio);
  const verdict: string[] = [];
  verdict.push(c.aaBody ? "AA body ✓ (4.5:1)" : "AA body ✗ (needs 4.5:1)");
  verdict.push(c.aaLarge ? "AA large/UI ✓ (3:1)" : "AA large/UI ✗ (needs 3:1)");
  if (c.aaaBody) verdict.push("AAA body ✓ (7:1)");
  return `**${foreground} on ${background}** → ${ratio.toFixed(2)}:1 · ${verdict.join(" · ")}`;
}

function renderAuditBody(params: {
  markup: string;
  foreground?: string;
  background?: string;
}): string {
  const { markup, foreground, background } = params;
  const lines: string[] = [];

  const contrastLine = renderContrastCheck(foreground, background);
  if (contrastLine) {
    lines.push("### Color-pair contrast");
    lines.push("");
    lines.push(contrastLine);
    lines.push("");
  }

  const trimmed = markup.trim();
  if (!trimmed) {
    if (!contrastLine) {
      lines.push("No `existingMarkup` and no color pair passed — nothing mechanically parseable. Ask the designer to paste the component JSX/HTML or a foreground+background hex pair.");
    } else {
      lines.push(
        "_No markup passed — color-contrast check only. Paste HTML/JSX to audit alts, labels, headings, landmarks, anchor/button semantics._",
      );
    }
    return lines.join("\n");
  }

  const findings = runA11yAudit(trimmed);
  const errors = findings.filter((f) => f.severity === "error");
  const warns = findings.filter((f) => f.severity === "warn");
  const infos = findings.filter((f) => f.severity === "info");

  lines.push(
    `**Parsed ${trimmed.length} char(s) of markup.** Flagged ${errors.length} error(s), ${warns.length} warning(s), ${infos.length} info note(s). Regex-based pass — not a full ARIA simulator, but catches the classic patterns.`,
  );
  lines.push("");

  lines.push("### Errors (screen-reader breakers)");
  lines.push("");
  lines.push(renderFindings(errors));
  lines.push("");

  lines.push("### Warnings (WCAG-risk, degrade UX)");
  lines.push("");
  lines.push(renderFindings(warns));
  lines.push("");

  lines.push("### Info (worth confirming)");
  lines.push("");
  lines.push(renderFindings(infos));
  lines.push("");

  return lines.join("\n");
}

export const accessibilitySpecialistTool = defineTool({
  name: "accessibility-specialist",
  title: "Accessibility Specialist",
  description:
    "Audits markup + color pairs for WCAG 2.1 issues. In audit mode: parses pasted HTML/JSX for missing alts, unlabeled form controls, skipped heading levels, missing landmarks, broken anchor/button semantics; computes contrast on an optional color pair. In generate mode: returns an a11y checklist tailored to the brief.",
  inputSchema: {
    brief: z
      .string()
      .min(1)
      .describe(
        "What are you building or auditing? Describe the component / page / flow + any specific a11y asks.",
      ),
    mode: z
      .enum(["generate", "audit"])
      .optional()
      .describe(
        "'generate' (default) returns a tailored a11y checklist. 'audit' parses existingMarkup and/or a color pair and returns server-computed findings.",
      ),
    existingMarkup: z
      .string()
      .optional()
      .describe(
        "Audit mode input. Paste HTML or JSX for the component/page. Regex-based parse — flags missing alts, unlabeled inputs, heading-level skips, missing <main>, anchor-used-as-button, buttons without accessible names.",
      ),
    foreground: z
      .string()
      .optional()
      .describe("Audit mode input. Hex foreground for a contrast check (e.g. text color)."),
    background: z
      .string()
      .optional()
      .describe("Audit mode input. Hex background for a contrast check (e.g. surface behind the text)."),
  },
  outputKind: "markdown",
  handler: ({ brief, mode, existingMarkup, foreground, background }) => {
    const isAudit = mode === "audit";

    if (isAudit) {
      const auditBody = renderAuditBody({
        markup: existingMarkup ?? "",
        foreground,
        background,
      });
      const text = composeRolePrompt({
        roleName: "Accessibility Specialist — Audit Mode",
        commandFile: "accessibility-specialist.md",
        sections: [
          { heading: "Designer's brief", body: brief },
          { heading: "Mode", body: "audit — no fresh checklist will be generated." },
          { heading: "Audit result (server-computed)", body: auditBody },
        ],
        closingInstruction:
          "Respond as a senior a11y auditor. Lead with the errors (screen-reader breakers) — each finding should name WHERE it surfaces (which assistive tech, which user) and the exact markup fix. Warnings come next; info notes last. Do NOT produce a generic a11y checklist — the designer has specific markup; speak to it.",
      });
      return {
        text,
        output: {
          type: "markdown",
          data: {
            title: "Accessibility audit",
            content: auditBody,
          },
        },
      };
    }

    const text = composeRolePrompt({
      roleName: "Accessibility Specialist",
      commandFile: "accessibility-specialist.md",
      sections: [
        { heading: "Designer's brief", body: brief },
      ],
      closingInstruction:
        "Produce a targeted a11y checklist. Cover: (1) semantic HTML + landmarks, (2) keyboard nav + focus, (3) ARIA where needed (and where NOT to use it), (4) color/contrast requirements, (5) screen-reader announcements, (6) motion/reduced-motion. Tailor to the component/flow in the brief — not a generic WCAG reference.",
    });
    return {
      text,
      output: {
        type: "markdown",
        data: {
          title: "Accessibility checklist",
          content: `**Brief:** ${brief}`,
        },
      },
    };
  },
});
