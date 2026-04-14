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
