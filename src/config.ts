import { fileURLToPath } from "node:url";

export interface DwcConfig {
  token: string | undefined;
  apiUrl: string;
  eventsEnabled: boolean;
  gatingEnabled: boolean;
  commandsDir: string;
}

function resolveCommandsDir(): string {
  const fromEnv = process.env.DWC_COMMANDS_DIR?.trim();
  if (fromEnv) return fromEnv;
  return fileURLToPath(new URL("../commands/", import.meta.url));
}

export function loadConfig(): DwcConfig {
  return {
    token: process.env.DWC_TOKEN?.trim() || undefined,
    apiUrl: (process.env.DWC_API_URL?.trim() || "https://designwithclaude.com").replace(/\/$/, ""),
    eventsEnabled: process.env.DWC_EVENTS !== "off",
    gatingEnabled: process.env.DWC_GATING === "on",
    commandsDir: resolveCommandsDir(),
  };
}
