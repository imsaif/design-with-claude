import type { ApiClient } from "./api-client.js";
import type { DwcConfig } from "./config.js";
import { log } from "./logger.js";

export interface GateDecision {
  allowed: boolean;
  text?: string;
}

export async function checkGate(
  api: ApiClient,
  config: DwcConfig,
  toolName: string,
): Promise<GateDecision> {
  if (!config.gatingEnabled) return { allowed: true };

  if (!config.token) {
    return {
      allowed: false,
      text:
        "designwithclaude is not configured with a token. Run `npx designwithclaude setup --token=imr_xxx` and restart Claude Code.",
    };
  }

  const res = await api.gatingCheck({
    token: config.token,
    toolName,
    project: config.projectId,
  });
  if (res.allowed) return { allowed: true };

  const fallbackMessage =
    res.message ??
    (res.reason === "free_tier_exhausted"
      ? "You've used 10/10 free commands. Upgrade at https://designwithclaude.com/upgrade"
      : res.reason === "subscription_cancelled"
        ? "Your profile is frozen. Resubscribe at https://designwithclaude.com/upgrade to resume."
        : "This tool is not available on your current plan.");

  log.info("tool blocked by gate", { toolName, reason: res.reason });
  return { allowed: false, text: fallbackMessage };
}

export async function consumeGate(
  api: ApiClient,
  config: DwcConfig,
  toolName: string,
): Promise<void> {
  if (!config.gatingEnabled || !config.token) return;
  await api.gatingConsume({
    token: config.token,
    toolName,
    project: config.projectId,
  });
}
