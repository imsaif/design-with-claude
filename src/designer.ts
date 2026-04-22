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

// Cap the gist tail so the memory block stays scannable — 120 chars per bullet
// keeps ~5 bullets well under a screen.
const GIST_MAX = 120;

function capGist(s: string): string {
  if (s.length <= GIST_MAX) return s;
  return s.slice(0, GIST_MAX - 1).trimEnd() + "…";
}

// The renderAuditBody helpers on each audit tool emit a "Flagged N error(s),
// M warning(s), P info note(s)" line. When an audit tool returns a markdown
// payload we can mine that summary directly without reparsing the markup.
const FLAGGED_COUNTS_RE = /Flagged\s+(\d+)\s+error\(s\),\s+(\d+)\s+warning\(s\),\s+(\d+)\s+info\s+note\(s\)/i;

function parseFlaggedCounts(content: string): { errors: number; warns: number; infos: number } | null {
  const m = content.match(FLAGGED_COUNTS_RE);
  if (!m) return null;
  return { errors: Number(m[1]), warns: Number(m[2]), infos: Number(m[3]) };
}

function describeEvent(event: RecentEvent, kind: string): string {
  const input = (event.input as Record<string, unknown> | null | undefined) ?? {};
  const output = (event.output as Record<string, unknown> | null | undefined) ?? {};
  const data = (output.data as Record<string, unknown> | null | undefined) ?? {};
  const mode = typeof input.mode === "string" ? input.mode : "generate";
  const prefix = mode === "audit" ? "(audit) " : "";

  switch (kind) {
    case "palette": {
      const tokens = Array.isArray(data.tokens) ? (data.tokens as Record<string, unknown>[]) : [];
      if (mode === "audit") {
        const mandatedAccent = typeof input.accent === "string" ? input.accent : null;
        const accentPresent = mandatedAccent
          ? tokens.some(
              (t) => typeof t.hex === "string" && t.hex.toLowerCase() === mandatedAccent.toLowerCase(),
            )
          : null;
        const accentNote =
          mandatedAccent && accentPresent === true
            ? `; mandated ${mandatedAccent} present`
            : mandatedAccent && accentPresent === false
              ? `; mandated ${mandatedAccent} MISSING`
              : "";
        return capGist(`${prefix}${tokens.length} color tokens parsed${accentNote}`);
      }
      const accent = typeof input.accent === "string" ? input.accent : null;
      const accentNote = accent ? ` around ${accent}` : "";
      return capGist(`generated ${tokens.length}-token palette${accentNote}`);
    }
    case "type-scale": {
      const scale = Array.isArray(data.scale) ? (data.scale as Record<string, unknown>[]) : [];
      if (mode === "audit") {
        return capGist(`${prefix}${scale.length} type tokens parsed`);
      }
      const baseSize = typeof input.baseSizePx === "number" ? `base ${input.baseSizePx}px, ` : "";
      return capGist(`generated type scale: ${baseSize}${scale.length} role(s)`);
    }
    case "spacing": {
      const steps = Array.isArray(data.steps) ? (data.steps as Record<string, unknown>[]) : [];
      if (mode === "audit") {
        return capGist(`${prefix}${steps.length} spacing steps parsed`);
      }
      const baseUnit = typeof input.baseUnitPx === "number" ? `base ${input.baseUnitPx}px, ` : "";
      return capGist(`generated spacing scale: ${baseUnit}${steps.length} step(s)`);
    }
    case "markdown": {
      // Audit specialists (accessibility, form, navigation, content, motion, dsa)
      // all return markdown payloads whose content begins with the flagged-counts
      // summary. Mine it for a real gist.
      const content = typeof data.content === "string" ? data.content : "";
      const counts = parseFlaggedCounts(content);
      if (counts) {
        return capGist(
          `${prefix}${counts.errors} error(s), ${counts.warns} warn(s), ${counts.infos} info`,
        );
      }
      const title = typeof data.title === "string" ? data.title : null;
      if (mode === "audit") return capGist(title ? `audit: ${title}` : "produced a design-system audit");
      return capGist(title ?? "produced a markdown spec");
    }
    case "component-spec": {
      const title = typeof data.title === "string" ? data.title : null;
      const states = Array.isArray(data.states) ? (data.states as unknown[]).length : null;
      if (title && states !== null) return capGist(`component spec: ${title} (${states} state(s))`);
      if (title) return capGist(`component spec: ${title}`);
      return "produced a component spec";
    }
    case "copy": {
      const title = typeof data.title === "string" ? data.title : null;
      return capGist(title ? `copy: ${title}` : "produced UI copy");
    }
    default:
      return capGist(`called ${event.toolName}`);
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
