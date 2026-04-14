// Cached designer profile, fetched once at MCP server startup so every tool
// response can include the designer's context (CLAUDE.md, onboarding answers).
// Without this, Claude Code has no idea who the designer is and asks them to
// re-explain the product, stack, tone, etc. on every session.
import type { DesignerProfile } from "./api-client.js";

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

/**
 * Render the designer's profile as a plain-text section for inclusion in
 * MCP tool response payloads. Keeps the context compact so it doesn't blow
 * out Claude Code's input tokens on repeated calls.
 */
export function renderDesignerContext(): string {
  const profile = getDesignerProfile();
  if (!profile || !profile.onboarding) return "";
  const o = profile.onboarding;
  const lines: string[] = [
    "## Designer context (from designwithclaude.com onboarding)",
    "",
    `- **Building:** ${o.product_type} — ${o.product_description}`,
    `- **Stack:** ${o.tech_stack.join(", ")}`,
    `- **Design system:** ${o.design_system}`,
    `- **Experience:** ${o.experience_level}`,
    `- **Tone preference:** ${o.tone_preference}`,
  ];
  if (profile.claudeMd) {
    lines.push("", "### Full CLAUDE.md", "", profile.claudeMd);
  }
  lines.push(
    "",
    "Use this context to tailor your response — don't ask the designer to re-explain.",
  );
  return lines.join("\n");
}
