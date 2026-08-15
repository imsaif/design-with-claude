#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { loadConfig } from "./config.js";
import { log } from "./logger.js";
import { ApiClient } from "./api-client.js";
import { checkGate, consumeGate } from "./gating.js";
import { emitToolEvent } from "./events.js";
import { tools } from "./tools/index.js";
import type { ToolDefinition } from "./tools/types.js";
import {
  getDesignerProfile,
  setDesignerProfile,
  setRecentEventsSummary,
  summarizeEvent,
} from "./designer.js";
import { createSetProjectProfileTool } from "./tools/set-project-profile.js";
import {
  detectProjectConfig,
  renderDetectionHints,
  type DetectedProjectConfig,
} from "./utils/detect-project-config.js";

const PACKAGE_NAME = "dwic";
const PACKAGE_VERSION = "1.0.0-alpha.9";

// Tools that must work even when the project has no profile yet. hello-world
// is a ping; set-project-profile is how the gate is unblocked.
const ONBOARDING_GATE_EXEMPT = new Set(["hello-world", "set-project-profile"]);

// C10 slice 1 — memory context TTL. Refreshing on every tool call would add a
// network hop per invocation; 10s is long enough to amortize a burst and short
// enough that the next specialist sees the one you just ran.
const MEMORY_TTL_MS = 10_000;
let memoryLastFetchedAt = 0;

function memoryContextEnabled(config: ReturnType<typeof loadConfig>): boolean {
  if (!config.token) return false;
  if (process.env.DWIC_MEMORY_CONTEXT?.trim() === "off") return false;
  return true;
}

async function refreshMemoryContext(
  api: ApiClient,
  config: ReturnType<typeof loadConfig>,
): Promise<void> {
  if (!config.token) return;
  const events = await api.fetchRecentEvents(
    config.token,
    config.projectId ?? "default",
    10,
  );
  const summaries = events
    .filter((e) => e.toolName && !e.toolName.startsWith("__"))
    .map(summarizeEvent);
  setRecentEventsSummary(summaries);
  memoryLastFetchedAt = Date.now();
}

function onboardingGateEnabled(config: ReturnType<typeof loadConfig>): boolean {
  if (!config.token) return false; // no token = local dev, no gate
  if (process.env.DWIC_ONBOARDING_GATE?.trim() === "off") return false;
  return true;
}

function renderOnboardingResponse(
  toolName: string,
  projectId: string | undefined,
  detected: DetectedProjectConfig | null,
): string {
  const projectLabel = projectId ?? "(project unset)";
  const detectionBlock = detected ? renderDetectionHints(detected) : null;
  return [
    `# Onboarding required — no profile yet for \`${projectLabel}\``,
    "",
    `The designer just called \`${toolName}\` in a project dwic has never seen before. Running any specialist right now would make the designer re-brief the project from scratch — exactly the friction the onboarding flow is here to fix.`,
    "",
    ...(detectionBlock ? [detectionBlock, ""] : []),
    "## Do this before retrying",
    "",
    "1. Ask the designer these 6 questions, one at a time (don't batch — lets them answer naturally). Skip any they've already told you in this conversation and fill them in yourself.",
    "",
    "   - **Product type** — one line, what is this? (e.g. 'Conversational AI chat', 'Internal admin dashboard')",
    "   - **Product description** — one short paragraph: who uses it + what's the primary job? Include audience, constraints, anything unusual about the context.",
    "   - **Tech stack** — what are they building it in? (e.g. Next.js 15, Tailwind v4, TypeScript). Versions if known.",
    "   - **Design system / brand** — any mandated palette, type, tone? Existing tokens? Paste or paraphrase. If a brand manual exists, summarize it.",
    "   - **Experience level** — pick one: `beginner` · `intermediate` · `advanced`. Default to `intermediate` if they don't say.",
    "   - **Tone preference** — pick one: `concise` · `explanatory` · `encouraging`. Default to `concise` if they don't say.",
    "",
    "2. Call the `set-project-profile` MCP tool with the structured answers. Map free-form answers into the enum fields cleanly — don't invent enum values.",
    "",
    `3. Once \`set-project-profile\` returns success, retry \`${toolName}\` with the original brief. The tool will now have the designer's context and produce work tailored to this project, not a generic seed.`,
    "",
    "## Do NOT",
    "",
    "- Do NOT guess answers. If you don't know, ask.",
    "- Do NOT proceed by calling the tool again with a longer brief — the gate will still fire. The persistence path is `set-project-profile`.",
    "- Do NOT invent the 6 fields from thin air to unblock yourself. The point is that the designer's words land in the profile, verbatim, so future calls inherit the real context.",
  ].join("\n");
}

function registerTool(server: McpServer, tool: ToolDefinition, ctx: {
  api: ApiClient;
  config: ReturnType<typeof loadConfig>;
  detected: DetectedProjectConfig | null;
}): void {
  server.registerTool(
    tool.name,
    {
      title: tool.title,
      description: tool.description,
      inputSchema: tool.inputSchema,
    },
    async (rawInput: Record<string, unknown>) => {
      const toolName = tool.name;
      const input = rawInput ?? {};

      // Onboarding gate runs BEFORE gatingCheck so onboarding prompts don't
      // burn free-tier slots and so designers without a profile can't exhaust
      // their quota on a series of undirected tool calls.
      if (onboardingGateEnabled(ctx.config) && !ONBOARDING_GATE_EXEMPT.has(toolName)) {
        const profile = getDesignerProfile();
        if (!profile || !profile.onboarding) {
          return {
            content: [
              {
                type: "text" as const,
                text: renderOnboardingResponse(toolName, ctx.config.projectId, ctx.detected),
              },
            ],
          };
        }
      }

      const gate = await checkGate(ctx.api, ctx.config, toolName);
      if (!gate.allowed) {
        return {
          content: [{ type: "text" as const, text: gate.text ?? "Not allowed." }],
          isError: true,
        };
      }

      // Refresh memory context before handler runs so composeRolePrompt's
      // renderDesignerContext() picks up the latest events. TTL-gated to
      // avoid one extra hop per rapid-fire call.
      if (
        memoryContextEnabled(ctx.config) &&
        !ONBOARDING_GATE_EXEMPT.has(toolName) &&
        Date.now() - memoryLastFetchedAt > MEMORY_TTL_MS
      ) {
        await refreshMemoryContext(ctx.api, ctx.config).catch((err) =>
          log.debug("memory refresh failed", { err: String(err) }),
        );
      }

      try {
        const result = await tool.handler(input as never);

        emitToolEvent(ctx.api, ctx.config, {
          toolName,
          input,
          output: result.output,
        }).catch((err) => log.debug("event emit failed", { err: String(err) }));

        consumeGate(ctx.api, ctx.config, toolName).catch((err) =>
          log.debug("gate consume failed", { err: String(err) }),
        );

        return {
          content: [{ type: "text" as const, text: result.text }],
        };
      } catch (err) {
        log.error(`tool ${toolName} threw`, err);
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [
            {
              type: "text" as const,
              text: `dwic tool "${toolName}" failed: ${message}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}

async function main(): Promise<void> {
  const config = loadConfig();
  const api = new ApiClient(config);

  // C9 slice 3 — run the auto-detector once on boot so the onboarding gate can
  // surface pre-filled answers. Fail-open: detection errors never block the
  // server from starting; they just reduce confidence to "none".
  let detected: DetectedProjectConfig | null = null;
  try {
    detected = detectProjectConfig(process.cwd());
    log.info("project auto-detect", {
      framework: detected.framework,
      confidence: detected.confidence,
      techStack: detected.techStack,
    });
  } catch (err) {
    log.debug("project auto-detect failed", { err: String(err) });
  }

  const server = new McpServer({
    name: PACKAGE_NAME,
    version: PACKAGE_VERSION,
  });

  for (const tool of tools) {
    registerTool(server, tool, { api, config, detected });
  }
  // set-project-profile needs runtime access to api + config to persist answers
  // and update the in-process profile cache, so it's registered separately from
  // the static tools[] registry.
  registerTool(server, createSetProjectProfileTool({ api, config }), { api, config, detected });

  // Load the designer's profile so every tool response can include their
  // onboarding answers + CLAUDE.md. Without this, Claude Code has no context
  // about who the designer is and asks them to re-explain everything.
  if (config.token) {
    if (!config.projectId) {
      log.info(
        "DWIC_PROJECT_ID is not set — falling back to the 'default' project. " +
          "Re-run `npx dwic-audit setup --token=<token> --project=<slug>` to bind this install to a named project.",
      );
    }
    const effectiveProject = config.projectId ?? "default";
    const profile = await api.getProfile(config.token, effectiveProject);
    setDesignerProfile(profile);
    log.info("designer profile", {
      loaded: Boolean(profile),
      hasOnboarding: Boolean(profile?.onboarding),
      commandCount: profile?.commandCount ?? 0,
      project: effectiveProject,
    });
  }

  log.info(`starting ${PACKAGE_NAME} v${PACKAGE_VERSION}`, {
    tools: tools.map((t) => t.name),
    tokenPresent: Boolean(config.token),
    project: config.projectId ?? null,
    gating: config.gatingEnabled,
    events: config.eventsEnabled,
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  if (config.token) {
    api
      .emitEvent({
        token: config.token,
        toolName: "__mcp.connected__",
        input: {},
        output: { version: PACKAGE_VERSION },
        timestamp: new Date().toISOString(),
        project: config.projectId,
      })
      .catch((err) => log.debug("mcp.connected emit failed", { err: String(err) }));
  }
}

main().catch((err) => {
  log.error("fatal: MCP server failed to start", err);
  process.exit(1);
});
