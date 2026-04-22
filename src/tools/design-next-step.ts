import { z } from "zod";
import { defineTool } from "./types.js";
import { composeRolePrompt } from "./loadPrompt.js";
import { tools } from "./index.js";

// Tools that should never appear in the recommendation roster:
//   - design-next-step itself (no self-recursion)
//   - hello-world (ping, not a design action)
//   - set-project-profile (onboarding plumbing, not a specialist)
const RECOMMENDATION_EXCLUDES = new Set(["design-next-step", "hello-world", "set-project-profile"]);

function renderSpecialistRoster(): string {
  const lines = tools
    .filter((t) => !RECOMMENDATION_EXCLUDES.has(t.name))
    .map((t) => {
      const firstLine = t.description.split(/[.\n]/)[0]?.trim() ?? "";
      return `- **\`${t.name}\`** — ${t.title}. ${firstLine}.`;
    });
  if (lines.length === 0) {
    return "_(no specialists registered — recommend `design-brief` as a fallback)_";
  }
  return lines.join("\n");
}

export const designNextStepTool = defineTool({
  name: "design-next-step",
  title: "Design Next Step",
  description:
    "Reads the designer's project profile + recent decisions and recommends exactly one next specialist to run. Use when the designer asks 'what should I do next' or seems unsure which tool to invoke. Returns a single named recommendation with the exact MCP tool call, not a menu.",
  inputSchema: {
    focus: z
      .string()
      .optional()
      .describe(
        "Optional domain nudge: 'accessibility', 'visual', 'copy', 'motion', etc. Biases the recommendation toward that area without overriding obvious gaps in the system.",
      ),
  },
  outputKind: "markdown",
  handler: ({ focus }) => {
    const roster = renderSpecialistRoster();
    const sections = [
      { heading: "Available specialists", body: roster },
    ];
    if (focus && focus.trim()) {
      sections.push({
        heading: "Designer focus hint",
        body: `The designer asked you to bias toward: **${focus.trim()}**. Weight the recommendation accordingly, but still pick exactly one tool.`,
      });
    }
    const text = composeRolePrompt({
      roleName: "Design Next Step Recommender",
      commandFile: "design-next-step.md",
      sections,
      closingInstruction:
        "Recommend exactly ONE specialist to run next. Ground the recommendation in the Designer context and Recent design decisions above. Do not propose multiple tools. Follow the response format in the role's Guidelines step 3. If there is no profile or memory context at all, recommend `design-brief` and say why.",
    });
    return {
      text,
      output: {
        type: "markdown",
        data: {
          title: "Design next step",
          content: focus ? `Focus hint: ${focus.trim()}` : "No focus hint — purely context-driven.",
        },
      },
    };
  },
});
