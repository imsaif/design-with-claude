// Anonymous telemetry for `dwic audit`. The whole point of the CLI is to see
// if it's used, but that only works if the ping is a trust anchor not a
// liability. First-run notice + loud opt-out flags + category-count-only
// payload.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import type { CategoryResult } from "./aggregator.js";
import type { DetectedProjectConfig } from "../utils/detect-project-config.js";

interface ClientState {
  clientId?: string;
  telemetryNoticeShown?: boolean;
  telemetryOptOut?: boolean;
}

const STATE_DIR = join(homedir(), ".dwic");
const STATE_PATH = join(STATE_DIR, "state.json");
const DEFAULT_API = "https://designwithclaude.com";

function loadState(): ClientState {
  try {
    const raw = readFileSync(STATE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as ClientState) : {};
  } catch {
    return {};
  }
}

function saveState(state: ClientState): void {
  try {
    mkdirSync(STATE_DIR, { recursive: true });
    writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), "utf8");
  } catch {
    // non-fatal — telemetry is optional by design.
  }
}

function ensureClientId(state: ClientState): string {
  if (state.clientId) return state.clientId;
  const id = `anon_${randomBytes(6).toString("base64url")}`;
  state.clientId = id;
  saveState(state);
  return id;
}

export function maybePrintFirstRunNotice(writer: (line: string) => void, optOut: boolean): void {
  const state = loadState();
  if (state.telemetryNoticeShown) return;
  if (optOut) {
    state.telemetryNoticeShown = true;
    saveState(state);
    return;
  }
  writer("");
  writer(
    "dwic pings an anonymous counter on audit runs (no file contents, no paths, no project names).",
  );
  writer(
    "Pass --no-telemetry or set DWIC_TELEMETRY=off to disable. This is a one-time notice.",
  );
  writer("");
  state.telemetryNoticeShown = true;
  saveState(state);
}

export interface TelemetryPayload {
  schema: "dwic.audit.summary/1";
  version: string;
  clientId: string;
  framework: string;
  categoryCounts: Record<string, { error: number; warn: number; info: number }>;
  totals: { error: number; warn: number; info: number };
}

export function buildTelemetryPayload(
  version: string,
  clientId: string,
  results: CategoryResult[],
  detected: DetectedProjectConfig,
): TelemetryPayload {
  const categoryCounts: TelemetryPayload["categoryCounts"] = {};
  let tErr = 0;
  let tWarn = 0;
  let tInfo = 0;
  for (const r of results) {
    categoryCounts[r.category] = { ...r.counts };
    tErr += r.counts.error;
    tWarn += r.counts.warn;
    tInfo += r.counts.info;
  }
  return {
    schema: "dwic.audit.summary/1",
    version,
    clientId,
    framework: detected.framework,
    categoryCounts,
    totals: { error: tErr, warn: tWarn, info: tInfo },
  };
}

export async function emitAuditTelemetry(args: {
  version: string;
  results: CategoryResult[];
  detected: DetectedProjectConfig;
  apiUrl?: string;
  timeoutMs?: number;
}): Promise<void> {
  const state = loadState();
  if (state.telemetryOptOut) return;
  const clientId = ensureClientId(state);
  const payload = buildTelemetryPayload(args.version, clientId, args.results, args.detected);
  const apiBase = args.apiUrl ?? process.env.DWIC_API_URL ?? DEFAULT_API;
  const url = `${apiBase.replace(/\/+$/, "")}/api/events`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), args.timeoutMs ?? 2000);
  try {
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "user-agent": `dwic-audit-cli/${args.version}` },
      body: JSON.stringify({
        token: clientId,
        toolName: "__cli.audit.summary__",
        input: {},
        output: payload,
        timestamp: new Date().toISOString(),
        project: "__cli__",
      }),
      signal: controller.signal,
    });
  } catch {
    // Silent fail — telemetry never blocks or surfaces to the user.
  } finally {
    clearTimeout(timeout);
  }
}

export function isOptedOut(): boolean {
  return Boolean(loadState().telemetryOptOut);
}

// Utility for tests — not part of the public CLI surface.
export function _resetStateForTests(): void {
  try {
    writeFileSync(STATE_PATH, "{}", "utf8");
  } catch {
    // nothing
  }
}

export const _STATE_PATH = STATE_PATH;
