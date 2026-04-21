import { z } from "zod";
import { defineTool, type ToolDefinition } from "./types.js";
import type { ApiClient, DesignerProfile } from "../api-client.js";
import type { DwicConfig } from "../config.js";
import { setDesignerProfile } from "../designer.js";

interface Ctx {
  api: ApiClient;
  config: DwicConfig;
}

// Factory so the tool can close over the runtime api client + config that
// server.ts holds. Keeps the generic ToolDefinition shape simple while the
// onboarding tool has the deps it needs to persist to the dwic API.
export function createSetProjectProfileTool(ctx: Ctx): ToolDefinition {
  return defineTool({
    name: "set-project-profile",
    title: "Set Project Profile",
    description:
      "Persists the onboarding answers for this project so every future dwic tool call in this repo skips re-briefing. Call this once per project (the onboarding gate will prompt you the first time you invoke any other tool).",
    inputSchema: {
      product_type: z
        .string()
        .min(1)
        .describe(
          "One-line what the project is. Example: 'Conversational AI chat', 'Internal admin dashboard', 'Marketing site'.",
        ),
      product_description: z
        .string()
        .min(1)
        .describe(
          "One-paragraph who it's for and what it does. Include audience + primary job-to-be-done. Example: 'Chat UI for policy-decision makers at NewGlobe. Two modes (Lite/Pro). Generous reading density.'",
        ),
      tech_stack: z
        .array(z.string())
        .min(1)
        .describe(
          "Stack as an array. Example: ['Next.js 15', 'Tailwind v4', 'TypeScript']. Include framework versions where known.",
        ),
      design_system: z
        .string()
        .min(1)
        .describe(
          "Brand/design-system constraints as free text. Include mandated palette, type, tone. Example: 'NewGlobe brand manual — navy #1F3B90 + turquoise #00B7BD + Arial. Tone: clean, clear, no dark, no sad.'",
        ),
      experience_level: z
        .enum(["beginner", "intermediate", "advanced"])
        .describe("Designer's comfort level with code/tooling. Defaults to intermediate if unsure."),
      tone_preference: z
        .enum(["concise", "explanatory", "encouraging"])
        .describe("Response tone the designer prefers across future tool calls."),
    },
    outputKind: "markdown",
    handler: async (input) => {
      const token = ctx.config.token;
      const project = ctx.config.projectId;
      if (!token) {
        return {
          text:
            "Cannot persist profile: this MCP server is running without DWIC_TOKEN. " +
            "Run `npx dwic setup --token=<your token> --project=<slug>` and restart Claude Code before trying again.",
          output: {
            type: "markdown",
            data: { title: "set-project-profile — blocked", content: "missing DWIC_TOKEN" },
          },
        };
      }
      if (!project) {
        return {
          text:
            "Cannot persist profile: this MCP server has no DWIC_PROJECT_ID bound. " +
            "Re-run setup with `--project=<slug>` or add one to `.mcp.json` for this repo, then restart Claude Code.",
          output: {
            type: "markdown",
            data: { title: "set-project-profile — blocked", content: "missing DWIC_PROJECT_ID" },
          },
        };
      }

      const result = await ctx.api.submitProjectProfile({
        token,
        project,
        product_type: input.product_type,
        product_description: input.product_description,
        tech_stack: input.tech_stack,
        design_system: input.design_system,
        experience_level: input.experience_level,
        tone_preference: input.tone_preference,
      });

      if (!result.ok) {
        return {
          text:
            `Profile persist failed: ${result.reason}. Your answers were not saved. ` +
            "Check the designer's token + project slug and try again; if it keeps failing, the designer can persist via https://designwithclaude.com/start.",
          output: {
            type: "markdown",
            data: { title: "set-project-profile — failed", content: result.reason },
          },
        };
      }

      // Refetch so the in-process cache has the fresh profile — skips a
      // round-trip on the very next tool call and releases the onboarding gate.
      const profile: DesignerProfile | null = await ctx.api.getProfile(token, project);
      setDesignerProfile(profile);

      return {
        text:
          `Profile saved for project \`${project}\`. Future dwic tool calls in this repo will inherit the context — no re-briefing. ` +
          `Summary:\n\n` +
          `- **Product:** ${input.product_type} — ${input.product_description}\n` +
          `- **Stack:** ${input.tech_stack.join(", ")}\n` +
          `- **Design system:** ${input.design_system}\n` +
          `- **Experience / tone:** ${input.experience_level} · ${input.tone_preference}\n\n` +
          (result.claudeMd
            ? `A project CLAUDE.md was generated and stored on the companion — the designer can review it at https://designwithclaude.com/profile?token=<their token>.\n\n`
            : "") +
          "Now retry the tool call the designer originally asked for.",
        output: {
          type: "markdown",
          data: {
            title: `Profile saved — ${project}`,
            content: `${input.product_type}\n\n${input.product_description}`,
          },
        },
      };
    },
  }) as unknown as ToolDefinition;
}
