import { z } from "zod";
import { defineTool } from "./types.js";
import { composeRolePrompt } from "./loadPrompt.js";
import { runContentAudit, type ContentFinding } from "./content.js";

function renderSeverity(s: ContentFinding["severity"]): string {
  return s === "error" ? "✗" : s === "warn" ? "⚠" : "·";
}

function renderFindings(findings: ContentFinding[]): string {
  if (findings.length === 0) return "_No issues flagged in this pass._";
  return findings
    .map((f) => `- ${renderSeverity(f.severity)} \`${f.element}\` — ${f.message}`)
    .join("\n");
}

function renderAuditBody(copy: string): string {
  const trimmed = copy.trim();
  if (!trimmed) {
    return "The `existingCopy` you passed was empty. Paste the copy (plain text or HTML/JSX snippet) so the audit has something to inspect.";
  }
  const findings = runContentAudit(trimmed);
  const errors = findings.filter((f) => f.severity === "error");
  const warns = findings.filter((f) => f.severity === "warn");
  const infos = findings.filter((f) => f.severity === "info");

  const lines: string[] = [];
  lines.push(
    `**Parsed ${trimmed.length} char(s) of copy.** Flagged ${errors.length} error(s), ${warns.length} warning(s), ${infos.length} info note(s). Audit focuses on copy-level patterns: CTA strength, jargon/filler, passive voice, sentence length, all-caps shouting, heading case.`,
  );
  lines.push("");

  lines.push("### Warnings (clarity + conversion risk)");
  lines.push("");
  lines.push(renderFindings(warns));
  lines.push("");

  lines.push("### Info (style calls worth confirming)");
  lines.push("");
  lines.push(renderFindings(infos));
  lines.push("");

  return lines.join("\n");
}

export const contentStrategistTool = defineTool({
  name: "content-strategist",
  title: "Content Strategist",
  description:
    "Writes or audits product copy. In audit mode: parses pasted copy (plain text or markup) for weak CTAs, jargon, passive voice, over-long sentences, all-caps shouting, heading-case inconsistency. In generate mode: returns copy guidance tailored to the brief.",
  inputSchema: {
    brief: z
      .string()
      .min(1)
      .describe(
        "What copy are you writing or auditing? Describe audience, voice, surface (landing / product / docs), and key messages.",
      ),
    mode: z
      .enum(["generate", "audit"])
      .optional()
      .describe(
        "'generate' (default) returns a copy spec. 'audit' requires existingCopy and returns server-computed findings.",
      ),
    existingCopy: z
      .string()
      .optional()
      .describe(
        "Audit mode input. Paste the copy (plain text OR HTML/JSX). Heuristic checks — flags weak CTAs, jargon, passive voice, long sentences, all-caps, Title Case headings.",
      ),
  },
  outputKind: "markdown",
  handler: ({ brief, mode, existingCopy }) => {
    const isAudit = mode === "audit";

    if (isAudit) {
      const copy = existingCopy ?? "";
      const auditBody = renderAuditBody(copy);
      const text = composeRolePrompt({
        roleName: "Content Strategist — Audit Mode",
        commandFile: "content-strategist.md",
        sections: [
          { heading: "Designer's brief", body: brief },
          { heading: "Mode", body: "audit — no fresh copy will be generated." },
          { heading: "Audit result (server-computed)", body: auditBody },
        ],
        closingInstruction:
          "Respond as a senior content strategist. Lead with warnings (clarity/conversion risk), then info notes. For each finding, state the exact before→after rewrite (not general advice). Do NOT write fresh copy — the designer has copy; your job is to sharpen what's there.",
      });
      return {
        text,
        output: {
          type: "markdown",
          data: {
            title: "Copy audit",
            content: auditBody,
          },
        },
      };
    }

    const text = composeRolePrompt({
      roleName: "Content Strategist",
      commandFile: "content-strategist.md",
      sections: [{ heading: "Designer's brief", body: brief }],
      closingInstruction:
        "Produce a copy spec. Cover: (1) voice + tone rules tailored to the audience, (2) the 2–3 key phrases that carry the value prop, (3) CTA pattern (verb + outcome), (4) headline/body hierarchy, (5) microcopy for empty/error/loading states, (6) anti-patterns to avoid.",
    });
    return {
      text,
      output: {
        type: "markdown",
        data: {
          title: "Copy spec",
          content: `**Brief:** ${brief}`,
        },
      },
    };
  },
});
