import { z } from "zod";
import { defineTool } from "./types.js";
import { composeRolePrompt } from "./loadPrompt.js";
import { runFormAudit, type FormFinding } from "./form.js";

function renderSeverity(s: FormFinding["severity"]): string {
  return s === "error" ? "✗" : s === "warn" ? "⚠" : "·";
}

function renderFindings(findings: FormFinding[]): string {
  if (findings.length === 0) return "_No issues flagged in this pass._";
  return findings
    .map((f) => `- ${renderSeverity(f.severity)} \`${f.element}\` — ${f.message}`)
    .join("\n");
}

function renderAuditBody(markup: string): string {
  const trimmed = markup.trim();
  if (!trimmed) {
    return "The `existingMarkup` you passed was empty. Paste the form's HTML/JSX so the audit has something to inspect.";
  }
  const findings = runFormAudit(trimmed);
  const errors = findings.filter((f) => f.severity === "error");
  const warns = findings.filter((f) => f.severity === "warn");
  const infos = findings.filter((f) => f.severity === "info");

  const lines: string[] = [];
  lines.push(
    `**Parsed ${trimmed.length} char(s) of markup.** Flagged ${errors.length} error(s), ${warns.length} warning(s), ${infos.length} info note(s). Audit focuses on form-specific patterns: wrapper, types, required markers, error wiring, fieldset grouping, submit discrimination — not general a11y (call accessibility-specialist for that).`,
  );
  lines.push("");

  lines.push("### Errors (submits will break or users can't complete)");
  lines.push("");
  lines.push(renderFindings(errors));
  lines.push("");

  lines.push("### Warnings (UX or a11y risk)");
  lines.push("");
  lines.push(renderFindings(warns));
  lines.push("");

  lines.push("### Info (worth confirming)");
  lines.push("");
  lines.push(renderFindings(infos));
  lines.push("");

  return lines.join("\n");
}

export const formDesignerTool = defineTool({
  name: "form-designer",
  title: "Form Designer",
  description:
    "Designs or audits forms. In audit mode: parses pasted form HTML/JSX for missing <form> wrapper, implicit input types, `*`-only required markers, orphaned error hints not wired via aria-describedby, ungrouped radio/checkbox sets, multi-submit ambiguity. In generate mode: returns a form spec tailored to the brief.",
  inputSchema: {
    brief: z
      .string()
      .min(1)
      .describe("What form are you building or auditing? Describe fields, flow, error behavior, and any constraints."),
    mode: z
      .enum(["generate", "audit"])
      .optional()
      .describe(
        "'generate' (default) returns a form spec. 'audit' requires existingMarkup and returns server-computed findings.",
      ),
    existingMarkup: z
      .string()
      .optional()
      .describe(
        "Audit mode input. Paste the form's HTML or JSX. Regex-based parse — flags form wrapper, input types, required markers, error-hint wiring (aria-describedby), radio/checkbox fieldset grouping, multiple submits without `name`.",
      ),
  },
  outputKind: "markdown",
  handler: ({ brief, mode, existingMarkup }) => {
    const isAudit = mode === "audit";

    if (isAudit) {
      const markup = existingMarkup ?? "";
      const auditBody = renderAuditBody(markup);
      const text = composeRolePrompt({
        roleName: "Form Designer — Audit Mode",
        commandFile: "form-designer.md",
        sections: [
          { heading: "Designer's brief", body: brief },
          { heading: "Mode", body: "audit — no fresh form spec will be generated." },
          { heading: "Audit result (server-computed)", body: auditBody },
        ],
        closingInstruction:
          "Respond as a senior forms designer. Lead with errors (users literally can't complete the flow), then warnings (UX/a11y risk), then info. For each finding, state the fix as a specific markup change — not a generic principle. Do NOT produce a fresh form spec — the designer has one; your job is to make it submit-safe and screen-reader-honest.",
      });
      return {
        text,
        output: {
          type: "markdown",
          data: {
            title: "Form audit",
            content: auditBody,
          },
        },
      };
    }

    const text = composeRolePrompt({
      roleName: "Form Designer",
      commandFile: "form-designer.md",
      sections: [{ heading: "Designer's brief", body: brief }],
      closingInstruction:
        "Produce a form spec. Cover: (1) field list with input types, labels, autocomplete, required markers, and help text, (2) error-handling pattern (inline, summary, aria-live), (3) submit behavior + multi-step strategy if applicable, (4) mobile keyboard + autofill considerations, (5) success state + confirmation. Tailor to the brief.",
    });
    return {
      text,
      output: {
        type: "markdown",
        data: {
          title: "Form spec",
          content: `**Brief:** ${brief}`,
        },
      },
    };
  },
});
