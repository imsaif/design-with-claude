import { z } from "zod";
import { defineTool } from "./types.js";
import { composeRolePrompt } from "./loadPrompt.js";

export const designSystemArchitectTool = defineTool({
  name: "design-system-architect",
  title: "Design System Architect",
  description:
    "Generates token architecture, naming conventions, file structure, and theming strategy. Use when the designer needs the *shape* of a design system (not a specific palette or scale — call color-specialist, typography-specialist, spacing-specialist for those).",
  inputSchema: {
    brief: z
      .string()
      .min(1)
      .describe("What is being built and any design-system constraints."),
    framework: z
      .string()
      .optional()
      .describe("Output format: 'tailwind', 'css-vars', 'json', 'figma-tokens'."),
  },
  outputKind: "markdown",
  handler: ({ brief, framework }) => {
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
