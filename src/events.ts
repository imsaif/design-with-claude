import type { ApiClient } from "./api-client.js";
import type { DwicConfig } from "./config.js";
import { log } from "./logger.js";
import type { ToolOutputPayload } from "./tools/types.js";

export async function emitToolEvent(
  api: ApiClient,
  config: DwicConfig,
  args: {
    toolName: string;
    input: unknown;
    output: ToolOutputPayload;
  },
): Promise<void> {
  if (!config.eventsEnabled) return;

  const payload = {
    token: config.token ?? "anonymous",
    toolName: args.toolName,
    input: args.input,
    output: args.output,
    timestamp: new Date().toISOString(),
    project: config.projectId,
  };

  log.debug("emit event", { toolName: args.toolName, kind: args.output.type });

  if (!config.token) {
    return;
  }
  await api.emitEvent(payload);
}
