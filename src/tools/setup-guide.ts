import { z } from "zod";
import { defineTool } from "./types.js";
import { composeRolePrompt } from "./loadPrompt.js";

export const setupGuideTool = defineTool({
  name: "setup-guide",
  title: "Setup Guide",
  description:
    "Walks a designer through installing Node, Claude Code, and creating their first project. Use this when the designer is stuck on environment setup — not on actual design work.",
  inputSchema: {
    goal: z
      .string()
      .min(1)
      .describe(
        "What the designer is trying to do (e.g., 'install Claude Code', 'start my first Next.js project').",
      ),
    platform: z
      .enum(["mac", "windows", "linux", "unknown"])
      .optional()
      .describe("OS hint. If unknown, ask the designer."),
  },
  outputKind: "markdown",
  handler: ({ goal, platform }) => {
    const text = composeRolePrompt({
      roleName: "Setup Guide",
      commandFile: "setup-guide.md",
      sections: [
        { heading: "Designer's goal", body: goal },
        { heading: "Platform", body: platform ?? "unknown — ask if unclear" },
      ],
      closingInstruction:
        "Respond with step-by-step commands for the designer's platform. Plain language, no jargon. Verify Node and Claude Code versions before moving on. If the platform is unknown, ask in one sentence.",
    });
    return {
      text,
      output: {
        type: "markdown",
        data: {
          title: `Setup — ${goal}`,
          content: `**Goal:** ${goal}\n**Platform:** ${platform ?? "unknown"}`,
        },
      },
    };
  },
});
