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

const PACKAGE_NAME = "designwithclaude";
const PACKAGE_VERSION = "2.0.0-alpha.1";

function registerTool(server: McpServer, tool: ToolDefinition, ctx: {
  api: ApiClient;
  config: ReturnType<typeof loadConfig>;
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

      const gate = await checkGate(ctx.api, ctx.config, toolName);
      if (!gate.allowed) {
        return {
          content: [{ type: "text" as const, text: gate.text ?? "Not allowed." }],
          isError: true,
        };
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
              text: `dwc tool "${toolName}" failed: ${message}`,
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

  const server = new McpServer({
    name: PACKAGE_NAME,
    version: PACKAGE_VERSION,
  });

  for (const tool of tools) {
    registerTool(server, tool, { api, config });
  }

  log.info(`starting ${PACKAGE_NAME} v${PACKAGE_VERSION}`, {
    tools: tools.map((t) => t.name),
    tokenPresent: Boolean(config.token),
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
      })
      .catch((err) => log.debug("mcp.connected emit failed", { err: String(err) }));
  }
}

main().catch((err) => {
  log.error("fatal: MCP server failed to start", err);
  process.exit(1);
});
