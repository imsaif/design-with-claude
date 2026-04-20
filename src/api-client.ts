import { log } from "./logger.js";
import type { DwcConfig } from "./config.js";

export interface GatingCheckRequest {
  token: string;
  toolName: string;
  project?: string;
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
  project?: string;
}

export interface DesignerProfile {
  status: "free" | "paid" | "cancelled";
  commandCount: number;
  connected: boolean;
  onboarding?: {
    product_type: string;
    product_description: string;
    tech_stack: string[];
    design_system: string;
    experience_level: string;
    tone_preference: string;
  };
  claudeMd?: string;
}

export interface RecentEvent {
  id: string;
  toolName: string;
  input: unknown;
  output: unknown;
  timestamp: string;
  receivedAt: string;
  project?: string;
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

  async submitProjectProfile(args: {
    token: string;
    project: string;
    product_type: string;
    product_description: string;
    tech_stack: string[];
    design_system: string;
    experience_level: "beginner" | "intermediate" | "advanced";
    tone_preference: "concise" | "explanatory" | "encouraging";
  }): Promise<{ ok: true; claudeMd?: string } | { ok: false; reason: string }> {
    try {
      const res = await this.post<{ ok?: boolean; reason?: string; claudeMd?: string }>(
        "/api/profile",
        args,
      );
      if (res.ok) return { ok: true, claudeMd: res.claudeMd };
      return { ok: false, reason: res.reason ?? "unknown" };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { ok: false, reason: message };
    }
  }

  async getProfile(token: string, project: string | undefined): Promise<DesignerProfile | null> {
    try {
      const params = new URLSearchParams({ token });
      if (project) params.set("project", project);
      const url = `${this.config.apiUrl}/api/profile?${params.toString()}`;
      const res = await fetch(url, {
        method: "GET",
        headers: { "User-Agent": "designwithclaude-mcp/2.0" },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return null;
      const body = (await res.json()) as { ok?: boolean; profile?: DesignerProfile };
      if (!body.ok || !body.profile) return null;
      return body.profile;
    } catch (err) {
      log.debug("profile fetch failed (non-fatal)", {
        error: err instanceof Error ? err.message : String(err),
      });
      return null;
    }
  }

  async fetchRecentEvents(
    token: string,
    project: string | undefined,
    limit = 10,
  ): Promise<RecentEvent[]> {
    try {
      const params = new URLSearchParams({ token, limit: String(limit) });
      if (project) params.set("project", project);
      const url = `${this.config.apiUrl}/api/events/recent?${params.toString()}`;
      const res = await fetch(url, {
        method: "GET",
        headers: { "User-Agent": "designwithclaude-mcp/2.0" },
        signal: AbortSignal.timeout(3000),
      });
      if (!res.ok) return [];
      const body = (await res.json()) as {
        ok?: boolean;
        events?: Array<{
          id: string;
          toolName?: string;
          tool_name?: string;
          input?: unknown;
          output?: unknown;
          timestamp?: string;
          receivedAt?: string;
          received_at?: string;
          project?: string;
        }>;
      };
      if (!body.ok || !Array.isArray(body.events)) return [];
      return body.events.map((e) => ({
        id: e.id,
        toolName: (e.toolName ?? e.tool_name ?? "") as string,
        input: e.input,
        output: e.output,
        timestamp: (e.timestamp ?? "") as string,
        receivedAt: (e.receivedAt ?? e.received_at ?? "") as string,
        project: e.project,
      }));
    } catch (err) {
      log.debug("recent events fetch failed (non-fatal)", {
        error: err instanceof Error ? err.message : String(err),
      });
      return [];
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
