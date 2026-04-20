import { z } from "zod";
import { defineTool } from "./types.js";
import { composeRolePrompt } from "./loadPrompt.js";
import { buildArchitectureAudit, type ArchitectureAudit } from "./design-system.js";

function renderAuditBody(audit: ArchitectureAudit): string {
  if (audit.totalTokens === 0) {
    return "The `existingSystem` you passed contained no parseable CSS custom properties. Double-check the CSS reached the tool intact — paste the body of tokens.css / themes.css.";
  }

  const lines: string[] = [];
  lines.push(
    `**Parsed ${audit.totalTokens} custom propertie(s)** from your CSS. The audit inspects STRUCTURE — layering, theming, naming, and mapping — not individual values (use color-specialist, typography-specialist, spacing-specialist for value audits).`,
  );
  lines.push("");

  lines.push("### Layering (primitive ↔ semantic)");
  lines.push("");
  lines.push(`- Primitives (literal values): **${audit.layering.primitive}**`);
  lines.push(`- Semantics (var() references): **${audit.layering.semantic}**`);
  lines.push(`- Verdict: ${audit.layering.verdict}`);
  lines.push("");

  lines.push("### Theming strategy");
  lines.push("");
  if (audit.theming.hasDarkScope) {
    lines.push(`- Dark scope(s) detected: ${audit.theming.darkSelectors.map((s) => `\`${s}\``).join(", ")}`);
    lines.push(`- Tokens overridden in dark scope: **${audit.theming.tokensOverriddenInDark}**`);
    if (audit.theming.overriddenSampleNames.length > 0) {
      lines.push(`- Sample overrides: ${audit.theming.overriddenSampleNames.map((n) => `\`${n}\``).join(", ")}`);
    }
  } else {
    lines.push("- No dark-mode / theme-scoped selectors detected.");
  }
  lines.push("");

  lines.push("### Naming consistency");
  lines.push("");
  lines.push(
    `- ${audit.naming.withCategoryPrefix}/${audit.naming.totalTokens} tokens use a clear category prefix.`,
  );
  if (audit.naming.categories.length > 0) {
    lines.push(`- Categories detected: ${audit.naming.categories.map((c) => `\`${c}\``).join(", ")}`);
  }
  if (audit.naming.inconsistencies.length === 0) {
    lines.push("- No inconsistencies flagged.");
  } else {
    for (const issue of audit.naming.inconsistencies) lines.push(`- ⚠ ${issue}`);
  }
  lines.push("");

  lines.push("### Semantic → primitive mapping");
  lines.push("");
  lines.push(`- Semantic tokens: **${audit.mapping.semanticCount}** · resolvable refs: **${audit.mapping.resolvableRefs}** · broken refs: **${audit.mapping.brokenRefs.length}**`);
  if (audit.mapping.brokenRefs.length > 0) {
    lines.push("- Broken references:");
    for (const br of audit.mapping.brokenRefs.slice(0, 10)) {
      lines.push(`  - \`${br.token}\` → \`${br.ref}\` (no such token)`);
    }
    if (audit.mapping.brokenRefs.length > 10) {
      lines.push(`  - …and ${audit.mapping.brokenRefs.length - 10} more.`);
    }
  }
  lines.push("");

  lines.push("### Senior-designer summary (server-computed)");
  lines.push("");
  for (const s of audit.summary) lines.push(`- ${s}`);
  lines.push("");

  return lines.join("\n");
}

export const designSystemArchitectTool = defineTool({
  name: "design-system-architect",
  title: "Design System Architect",
  description:
    "Generates or audits a token architecture. In generate mode: proposes naming, file structure, theming, and mapping. In audit mode: parses your existing CSS custom properties and reports on layering, theming, naming consistency, and broken semantic references. Use the value-specialists (color, typography, spacing) for value-level audits.",
  inputSchema: {
    brief: z
      .string()
      .min(1)
      .describe("What is being built and any design-system constraints."),
    framework: z
      .string()
      .optional()
      .describe("Output format for generate mode: 'tailwind', 'css-vars', 'json', 'figma-tokens'."),
    mode: z
      .enum(["generate", "audit"])
      .optional()
      .describe(
        "'generate' (default) proposes an architecture. 'audit' requires existingSystem and reports on layering, theming, naming, and mapping.",
      ),
    existingSystem: z
      .string()
      .optional()
      .describe(
        "Required for audit mode. Paste the CSS containing your design tokens (tokens.css / themes.css). The audit looks at ALL `--*` declarations, not just one category.",
      ),
  },
  outputKind: "markdown",
  handler: ({ brief, framework, mode, existingSystem }) => {
    const isAudit = mode === "audit";

    if (isAudit) {
      const css = existingSystem?.trim();
      if (!css) {
        const text = composeRolePrompt({
          roleName: "Design System Architect — Audit Mode",
          commandFile: "design-system-architect.md",
          sections: [
            { heading: "Designer's brief", body: brief },
            {
              heading: "Mode",
              body: "audit — but no `existingSystem` was passed. The tool cannot audit what it cannot see.",
            },
          ],
          closingInstruction:
            "Tell the designer audit mode requires `existingSystem`. Ask them to paste the body of tokens.css / themes.css. Do NOT propose a fresh architecture — that is generate mode.",
        });
        return {
          text,
          output: {
            type: "markdown",
            data: {
              title: "Design system audit — missing input",
              content: "No existingSystem CSS was provided.",
            },
          },
        };
      }
      const audit = buildArchitectureAudit(css);
      const auditBody = renderAuditBody(audit);
      const text = composeRolePrompt({
        roleName: "Design System Architect — Audit Mode",
        commandFile: "design-system-architect.md",
        sections: [
          { heading: "Designer's brief", body: brief },
          { heading: "Mode", body: "audit — no fresh architecture will be generated." },
          { heading: "Audit result (server-computed)", body: auditBody },
        ],
        closingInstruction:
          "Respond with a senior-architect audit. Lead with the highest-leverage structural finding (broken mapping > missing semantic layer > naming drift > incomplete theming). For each finding, state the risk in plain language (what breaks, where) and the one-line fix. Do NOT propose a fresh token architecture — the designer has one; your job is to harden it.",
      });
      return {
        text,
        output: {
          type: "markdown",
          data: {
            title: "Design system audit",
            content: auditBody,
          },
        },
      };
    }

    const text = composeRolePrompt({
      roleName: "Design System Architect",
      commandFile: "design-system-architect.md",
      sections: [
        { heading: "Designer's brief", body: brief },
        ...(framework
          ? [{ heading: "Preferred token format", body: framework }]
          : []),
      ],
      closingInstruction:
        "Produce: (1) token categories + naming convention, (2) file structure, (3) theming/dark-mode plan, (4) semantic ↔ primitive mapping rules. Output in the requested framework format if specified; otherwise CSS custom properties.",
    });
    return {
      text,
      output: {
        type: "markdown",
        data: {
          title: "Design system architecture",
          content: `**Brief:** ${brief}${framework ? `\n**Format:** ${framework}` : ""}`,
        },
      },
    };
  },
});
