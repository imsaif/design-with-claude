import { z } from "zod";
import { defineTool } from "./types.js";
import { composeRolePrompt } from "./loadPrompt.js";
import { runNavAudit, type NavFinding } from "./navigation.js";

function renderSeverity(s: NavFinding["severity"]): string {
  return s === "error" ? "✗" : s === "warn" ? "⚠" : "·";
}

function renderFindings(findings: NavFinding[]): string {
  if (findings.length === 0) return "_No issues flagged in this pass._";
  return findings
    .map((f) => `- ${renderSeverity(f.severity)} \`${f.element}\` — ${f.message}`)
    .join("\n");
}

function renderAuditBody(markup: string): string {
  const trimmed = markup.trim();
  if (!trimmed) {
    return "The `existingMarkup` you passed was empty. Paste the nav's HTML/JSX (or a page snippet that includes the nav) so the audit has something to inspect.";
  }
  const findings = runNavAudit(trimmed);
  const errors = findings.filter((f) => f.severity === "error");
  const warns = findings.filter((f) => f.severity === "warn");
  const infos = findings.filter((f) => f.severity === "info");

  const lines: string[] = [];
  lines.push(
    `**Parsed ${trimmed.length} char(s) of markup.** Flagged ${errors.length} error(s), ${warns.length} warning(s), ${infos.length} info note(s). Audit focuses on nav-specific patterns: landmarks + labels, current-page indication, skip link, nesting depth, mobile disclosure.`,
  );
  lines.push("");

  lines.push("### Errors");
  lines.push("");
  lines.push(renderFindings(errors));
  lines.push("");

  lines.push("### Warnings (wayfinding/a11y risk)");
  lines.push("");
  lines.push(renderFindings(warns));
  lines.push("");

  lines.push("### Info (worth confirming)");
  lines.push("");
  lines.push(renderFindings(infos));
  lines.push("");

  return lines.join("\n");
}

export const navigationSpecialistTool = defineTool({
  name: "navigation-specialist",
  title: "Navigation Specialist",
  description:
    "Designs or audits navigation. In audit mode: parses pasted nav HTML/JSX for landmark presence + distinguishing labels, aria-current on the active link, skip-to-content link, nesting depth, mobile disclosure patterns. In generate mode: returns a navigation spec tailored to the brief.",
  inputSchema: {
    brief: z
      .string()
      .min(1)
      .describe("What nav are you building or auditing? Describe IA, depth, mobile behavior, primary vs secondary."),
    mode: z
      .enum(["generate", "audit"])
      .optional()
      .describe(
        "'generate' (default) returns a nav spec. 'audit' requires existingMarkup and returns server-computed findings.",
      ),
    existingMarkup: z
      .string()
      .optional()
      .describe(
        "Audit mode input. Paste the nav HTML or JSX (or a page snippet containing it). Regex-based parse — flags missing/unlabeled <nav>, active-state without aria-current, absent skip link, deep nesting, large nav without disclosure toggle.",
      ),
  },
  outputKind: "markdown",
  handler: ({ brief, mode, existingMarkup }) => {
    const isAudit = mode === "audit";

    if (isAudit) {
      const markup = existingMarkup ?? "";
      const auditBody = renderAuditBody(markup);
      const text = composeRolePrompt({
        roleName: "Navigation Specialist — Audit Mode",
        commandFile: "navigation-specialist.md",
        sections: [
          { heading: "Designer's brief", body: brief },
          { heading: "Mode", body: "audit — no fresh nav spec will be generated." },
          { heading: "Audit result (server-computed)", body: auditBody },
        ],
        closingInstruction:
          "Respond as a senior navigation / IA designer. Lead with warnings (wayfinding breakers), then info notes. For each finding, state WHERE the user feels the pain (first-time visitor, keyboard user, mobile screen-reader) and the exact markup fix. Do NOT propose a fresh IA — the designer has one; your job is to make it legible and navigable.",
      });
      return {
        text,
        output: {
          type: "markdown",
          data: {
            title: "Navigation audit",
            content: auditBody,
          },
        },
      };
    }

    const text = composeRolePrompt({
      roleName: "Navigation Specialist",
      commandFile: "navigation-specialist.md",
      sections: [{ heading: "Designer's brief", body: brief }],
      closingInstruction:
        "Produce a navigation spec. Cover: (1) IA ladder (primary + secondary + utility), (2) active-state indication (aria-current + visual), (3) mobile disclosure pattern, (4) skip links + landmarks, (5) keyboard ordering + focus handling, (6) scaling strategy if the nav grows. Tailor to the brief.",
    });
    return {
      text,
      output: {
        type: "markdown",
        data: {
          title: "Navigation spec",
          content: `**Brief:** ${brief}`,
        },
      },
    };
  },
});
