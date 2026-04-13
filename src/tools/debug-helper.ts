import { z } from "zod";
import { defineTool } from "./types.js";
import { composeRolePrompt } from "./loadPrompt.js";

export const debugHelperTool = defineTool({
  name: "debug-helper",
  title: "Debug Helper",
  description:
    "Paste any error message and get the exact fix. Use when the designer hits a technical wall — build errors, runtime errors, install errors.",
  inputSchema: {
    error: z
      .string()
      .min(1)
      .describe("The full error message as it appeared in the terminal or browser."),
    context: z
      .string()
      .optional()
      .describe("What the designer was doing when the error happened."),
    stack: z
      .string()
      .optional()
      .describe("Optional: stack name (e.g., 'Next.js 15 on Vercel')."),
  },
  outputKind: "markdown",
  handler: ({ error, context, stack }) => {
    const text = composeRolePrompt({
      roleName: "Debug Helper",
      commandFile: "debug-helper.md",
      sections: [
        { heading: "Error message", body: error },
        ...(context ? [{ heading: "What the designer was doing", body: context }] : []),
        ...(stack ? [{ heading: "Stack", body: stack }] : []),
      ],
      closingInstruction:
        "Respond with: (1) one-sentence plain-English explanation of the error, (2) the exact fix — commands or code — and (3) how to prevent it next time. If the error is ambiguous, ask one clarifying question instead of guessing.",
    });
    return {
      text,
      output: {
        type: "markdown",
        data: {
          title: "Debug helper",
          content: `**Error:** ${error.slice(0, 200)}${error.length > 200 ? "…" : ""}`,
        },
      },
    };
  },
});
