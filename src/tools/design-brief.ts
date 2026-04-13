import { z } from "zod";
import { defineTool } from "./types.js";
import { composeRolePrompt } from "./loadPrompt.js";

export const designBriefTool = defineTool({
  name: "design-brief",
  title: "Design Brief (Master)",
  description:
    "Master design command. Accepts a plain-English brief and orchestrates the right design specialists (color, type, spacing, layout, accessibility, etc.). Use this when the designer describes a whole project or page, not a single concern.",
  inputSchema: {
    brief: z
      .string()
      .min(1)
      .describe("The designer's brief — what they're building, for whom, any constraints."),
    stack: z
      .string()
      .optional()
      .describe("Optional stack hint, e.g. 'Next.js 15 + Tailwind'."),
    designSystem: z
      .string()
      .optional()
      .describe("Optional existing design system or 'starting fresh'."),
  },
  outputKind: "markdown",
  handler: ({ brief, stack, designSystem }) => {
    const text = composeRolePrompt({
      roleName: "Design with Claude (Master)",
      commandFile: "design-brief.md",
      sections: [
        { heading: "Designer's brief", body: brief },
        ...(stack ? [{ heading: "Stack", body: stack }] : []),
        ...(designSystem
          ? [{ heading: "Existing design system", body: designSystem }]
          : []),
      ],
      closingInstruction:
        "Apply the master routing flow above. Identify the 3-6 most relevant specialists, synthesise decisions, and deliver implementation-ready artifacts. Keep the response tight — specific tokens, specific values, no generic advice.",
    });
    return {
      text,
      output: {
        type: "markdown",
        data: {
          title: "Design brief — routed plan",
          content: `**Brief:** ${brief}${stack ? `\n\n**Stack:** ${stack}` : ""}${designSystem ? `\n\n**Existing system:** ${designSystem}` : ""}`,
        },
      },
    };
  },
});
