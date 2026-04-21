import { fileURLToPath } from "node:url";

export interface DwicConfig {
  token: string | undefined;
  /** Project slug, from DWIC_PROJECT_ID env. One MCP process per project — no runtime switching. */
  projectId: string | undefined;
  apiUrl: string;
  eventsEnabled: boolean;
  gatingEnabled: boolean;
  commandsDir: string;
}

function resolveCommandsDir(): string {
  const fromEnv = process.env.DWIC_COMMANDS_DIR?.trim();
  if (fromEnv) return fromEnv;
  return fileURLToPath(new URL("../commands/", import.meta.url));
}

export function loadConfig(): DwicConfig {
  return {
    token: process.env.DWIC_TOKEN?.trim() || undefined,
    projectId: process.env.DWIC_PROJECT_ID?.trim() || undefined,
    apiUrl: (process.env.DWIC_API_URL?.trim() || "https://designwithclaude.com").replace(/\/$/, ""),
    eventsEnabled: process.env.DWIC_EVENTS !== "off",
    gatingEnabled: process.env.DWIC_GATING === "on",
    commandsDir: resolveCommandsDir(),
  };
}
