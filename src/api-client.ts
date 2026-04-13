import { log } from "./logger.js";
import type { DwcConfig } from "./config.js";

export interface GatingCheckRequest {
  token: string;
  toolName: string;
}

export interface GatingCheckResponse {
  allowed: boolean;
  reason?: string;
  message?: string;
  remaining?: number;
}

export interface EventPayload {
  token: string;
  toolName: string;
  input: unknown;
  output: unknown;
  timestamp: string;
}

export class ApiClient {
  constructor(private readonly config: DwcConfig) {}

  async gatingCheck(req: GatingCheckRequest): Promise<GatingCheckResponse> {
    if (!this.config.gatingEnabled) {
      return { allowed: true };
    }
    try {
      const res = await this.post<GatingCheckResponse>("/api/gating/check", req);
      return res;
    } catch (err) {
      log.error("gating check failed, allowing by default", err);
      return { allowed: true };
    }
  }

  async gatingConsume(req: GatingCheckRequest): Promise<void> {
    if (!this.config.gatingEnabled) return;
    try {
      await this.post("/api/gating/consume", req);
    } catch (err) {
      log.error("gating consume failed (non-fatal)", err);
    }
  }

  async emitEvent(payload: EventPayload): Promise<void> {
    if (!this.config.eventsEnabled) return;
    try {
      await this.post("/api/events", payload);
    } catch (err) {
      log.debug("event emission failed (non-fatal)", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  private async post<T = unknown>(path: string, body: unknown): Promise<T> {
    const url = `${this.config.apiUrl}${path}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "designwithclaude-mcp/2.0",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`POST ${path} → ${res.status} ${res.statusText}`);
    }
    const text = await res.text();
    return (text ? JSON.parse(text) : {}) as T;
  }
}
