// Mirrors src/api-client.ts in the MCP server. Keep in sync until we extract a
// shared package.

export interface GatingCheckRequest {
  token: string;
  toolName: string;
}

export interface GatingCheckResponse {
  allowed: boolean;
  reason?: "invalid_token" | "free_tier_exhausted" | "subscription_cancelled" | string;
  message?: string;
  remaining?: number;
}

export type OutputKind =
  | "palette"
  | "type-scale"
  | "spacing"
  | "component-spec"
  | "copy"
  | "markdown";

export interface PaletteData {
  name: string;
  tokens: Array<{ name: string; hex: string; role: string }>;
}
export interface TypeScaleData {
  name: string;
  scale: Array<{ role: string; clamp: string; lineHeight: string | number; weight: number | string }>;
}
export interface SpacingData {
  name: string;
  steps: Array<{ name: string; px: number; rem: number }>;
}
export interface ComponentSpecData {
  name: string;
  anatomy: string;
  states: string[];
  accessibility: string;
  markup: string;
}
export interface CopyData {
  context: string;
  tone: string;
  blocks: Array<{ label: string; text: string }>;
}
export interface MarkdownData {
  title: string;
  content: string;
}
export type ToolOutputPayload =
  | { type: "palette"; data: PaletteData }
  | { type: "type-scale"; data: TypeScaleData }
  | { type: "spacing"; data: SpacingData }
  | { type: "component-spec"; data: ComponentSpecData }
  | { type: "copy"; data: CopyData }
  | { type: "markdown"; data: MarkdownData };

export interface EventPayload {
  token: string;
  toolName: string;
  input: unknown;
  output: unknown;
  timestamp: string;
}

export interface StoredEvent extends EventPayload {
  id: string;
  receivedAt: string;
}

export type SubscriptionStatus = "free" | "paid" | "cancelled";

export interface OnboardingAnswers {
  product_type: string;
  product_description: string;
  tech_stack: string[];
  design_system: string;
  experience_level: "beginner" | "intermediate" | "advanced";
  tone_preference: "concise" | "explanatory" | "encouraging";
}

export interface ProfileState {
  tokenHash: string;
  status: SubscriptionStatus;
  commandCount: number;
  createdAt: string;
  lastSeenAt: string;
  connected: boolean;
  onboarding?: OnboardingAnswers;
  claudeMd?: string;
}
