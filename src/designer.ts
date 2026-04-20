// Cached designer profile + recent-events memory, injected into every tool
// response so Claude Code sees who the designer is AND what design decisions
// this project has already produced. Without profile: Claude re-asks about
// stack/tone every session. Without memory: each tool call is blind to the
// earlier ones, so (e.g.) typography-specialist never knows color-specialist
// already audited tokens two minutes ago.
import type { DesignerProfile, RecentEvent } from "./api-client.js";

let cached: DesignerProfile | null = null;
let loaded = false;

export function setDesignerProfile(profile: DesignerProfile | null): void {
  cached = profile;
  loaded = true;
}

export function getDesignerProfile(): DesignerProfile | null {
  return cached;
}

export function hasDesignerProfile(): boolean {
  return loaded && cached !== null;
}

// ---------- Recent-events memory (C10 slice 1) ----------

export interface RecentEventSummary {
  toolName: string;
  kind: string;
  summary: string;
  timestamp: string;
}

let memoryCache: RecentEventSummary[] = [];

export function setRecentEventsSummary(summaries: RecentEventSummary[]): void {
  memoryCache = summaries;
}

export function getRecentEventsSummary(): RecentEventSummary[] {
  return memoryCache;
}

export function clearRecentEventsSummary(): void {
  memoryCache = [];
}

// Turn a stored event into a one-line gist. The output payload shape varies
// per tool (palette / type-scale / spacing / markdown / copy / component-spec)
// so we read defensively — unknown shapes fall back to "called with Nu input keys".
export function summarizeEvent(event: RecentEvent): RecentEventSummary {
  const kind = detectOutputKind(event.output);
  const summary = describeEvent(event, kind);
  return {
    toolName: event.toolName,
    kind,
    summary,
    timestamp: event.timestamp || event.receivedAt || "",
  };
}

function detectOutputKind(output: unknown): string {
  if (!output || typeof output !== "object") return "unknown";
  const rec = output as Record<string, unknown>;
  if (typeof rec.type === "string") return rec.type;
  return "unknown";
}

function describeEvent(event: RecentEvent, kind: string): string {
  const input = (event.input as Record<string, unknown> | null | undefined) ?? {};
  const output = (event.output as Record<string, unknown> | null | undefined) ?? {};
  const data = (output.data as Record<string, unknown> | null | undefined) ?? {};
  const mode = typeof input.mode === "string" ? input.mode : "generate";

  switch (kind) {
    case "palette": {
      const tokens = Array.isArray(data.tokens) ? data.tokens : [];
      if (mode === "audit") {
        return `audited ${tokens.length} color token(s)`;
      }
      return `generated a ${tokens.length}-token palette`;
    }
    case "type-scale": {
      const scale = Array.isArray(data.scale) ? data.scale : [];
      if (mode === "audit") {
        return `audited ${scale.length} type token(s)`;
      }
      return `generated a type scale with ${scale.length} role(s)`;
    }
    case "spacing": {
      const steps = Array.isArray(data.steps) ? data.steps : [];
      if (mode === "audit") {
        return `audited ${steps.length} spacing token(s)`;
      }
      return `generated a spacing scale with ${steps.length} step(s)`;
    }
    case "markdown": {
      if (mode === "audit") return `produced a design-system audit`;
      return `produced a design-system architecture note`;
    }
    case "component-spec":
      return `produced a component spec`;
    case "copy":
      return `produced UI copy`;
    default:
      return `called ${event.toolName}`;
  }
}

// ---------- Rendered context for composeRolePrompt ----------

/**
 * Render the designer's profile + recent-events memory as a plain-text section
 * for inclusion in MCP tool response payloads. Keeps the context compact so
 * it doesn't blow out Claude Code's input tokens on repeated calls.
 */
export function renderDesignerContext(): string {
  const profile = getDesignerProfile();
  const hasProfile = profile && profile.onboarding;
  const memory = getRecentEventsSummary();
  const hasMemory = memory.length > 0;
  if (!hasProfile && !hasMemory) return "";

  const lines: string[] = [];

  if (hasProfile) {
    const o = profile!.onboarding!;
    lines.push("## Designer context (from designwithclaude.com onboarding)");
    lines.push("");
    lines.push(`- **Building:** ${o.product_type} — ${o.product_description}`);
    lines.push(`- **Stack:** ${o.tech_stack.join(", ")}`);
    lines.push(`- **Design system:** ${o.design_system}`);
    lines.push(`- **Experience:** ${o.experience_level}`);
    lines.push(`- **Tone preference:** ${o.tone_preference}`);
    if (profile!.claudeMd) {
      lines.push("", "### Full CLAUDE.md", "", profile!.claudeMd);
    }
    lines.push(
      "",
      "Use this context to tailor your response — don't ask the designer to re-explain.",
    );
  }

  if (hasMemory) {
    if (lines.length > 0) lines.push("");
    lines.push("## Recent design decisions in this project");
    lines.push("");
    lines.push(
      "The designer already ran these specialists in this project. Build on what's there — don't rediscover or contradict earlier decisions without flagging why.",
    );
    lines.push("");
    // Most recent first, cap to 5
    const recent = memory.slice(-5).reverse();
    for (const m of recent) {
      lines.push(`- **${m.toolName}** — ${m.summary}`);
    }
  }

  return lines.join("\n");
}
