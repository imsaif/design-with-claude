import type { ToolOutputPayload } from "@/lib/dwc/types";

export type TileStatus = "active" | "coming_soon";
export type TileOutputKind = ToolOutputPayload["type"];

export interface Tile {
  id: string;
  category: "Foundation" | "Components" | "Patterns" | "Content" | "Quality";
  label: string;
  helper: string;
  status: TileStatus;
  // If set, this tile is "filled" when an event of this output kind exists.
  outputKind?: TileOutputKind;
  // Tool name in the MCP server; used to build the Claude Code prompt.
  tool?: string;
  // Optional filter on output.data to match a specific kind of component-spec, etc.
  matches?: (payload: ToolOutputPayload) => boolean;
}

function specMatches(name: string) {
  return (p: ToolOutputPayload) =>
    p.type === "component-spec" && p.data.name.toLowerCase().includes(name);
}

function copyMatches(context: string) {
  return (p: ToolOutputPayload) =>
    p.type === "copy" && (p.data.context?.toLowerCase().includes(context) ?? false);
}

function markdownMatches(title: string) {
  return (p: ToolOutputPayload) =>
    p.type === "markdown" && (p.data.title?.toLowerCase().includes(title) ?? false);
}

export const TILES: Tile[] = [
  // Foundation
  { id: "color", category: "Foundation", label: "Color palette", helper: "Primary, neutral, semantic — accessibility checked", status: "active", outputKind: "palette", tool: "color-specialist" },
  { id: "typography", category: "Foundation", label: "Typography", helper: "Fluid type scale with clamp() + weights", status: "active", outputKind: "type-scale", tool: "typography-specialist" },
  { id: "spacing", category: "Foundation", label: "Spacing", helper: "Non-linear scale that keeps rhythm", status: "active", outputKind: "spacing", tool: "spacing-specialist" },
  { id: "architecture", category: "Foundation", label: "Token architecture", helper: "Naming, file structure, theming strategy", status: "active", outputKind: "markdown", tool: "design-system-architect", matches: markdownMatches("system") },
  { id: "iconography", category: "Foundation", label: "Iconography", helper: "Icon style, sizing, consistency rules", status: "coming_soon" },
  { id: "motion", category: "Foundation", label: "Motion", helper: "Durations, easing curves, micro-interactions", status: "coming_soon" },
  { id: "radius", category: "Foundation", label: "Radius & shadows", helper: "Corner radii + elevation scale", status: "coming_soon" },
  { id: "hierarchy", category: "Foundation", label: "Visual hierarchy", helper: "Focal points, F/Z patterns, priority map", status: "coming_soon" },

  // Components
  { id: "buttons", category: "Components", label: "Buttons", helper: "Primary, secondary, destructive — with states", status: "coming_soon" },
  { id: "forms", category: "Components", label: "Forms", helper: "Input, select, checkbox, validation, ARIA", status: "coming_soon", outputKind: "component-spec", matches: specMatches("form") },
  { id: "navigation", category: "Components", label: "Navigation", helper: "Top nav, sidebar, mobile patterns", status: "coming_soon", outputKind: "component-spec", matches: specMatches("nav") },
  { id: "tables", category: "Components", label: "Tables", helper: "Sort, filter, responsive behavior", status: "coming_soon" },
  { id: "modals", category: "Components", label: "Modals & sheets", helper: "Dialogs, confirmations, mobile sheets", status: "coming_soon" },
  { id: "states", category: "Components", label: "Empty / loading states", helper: "Skeleton, empty, error, success", status: "coming_soon" },

  // Patterns
  { id: "landing", category: "Patterns", label: "Landing page", helper: "Hero, social proof, CTA flow", status: "coming_soon" },
  { id: "dashboard", category: "Patterns", label: "Dashboard", helper: "Data density, widget hierarchy", status: "coming_soon" },
  { id: "auth", category: "Patterns", label: "Auth flows", helper: "Sign-up, login, password reset", status: "coming_soon" },
  { id: "onboarding", category: "Patterns", label: "Onboarding", helper: "First-run experience, progressive setup", status: "coming_soon" },
  { id: "pricing", category: "Patterns", label: "Pricing page", helper: "Tier layout, comparison, trust", status: "coming_soon" },

  // Content
  { id: "microcopy", category: "Content", label: "Microcopy", helper: "Button labels, errors, tooltips", status: "coming_soon", outputKind: "copy", matches: copyMatches("") },
  { id: "voice", category: "Content", label: "Brand voice", helper: "Tone map, words you use / don't", status: "coming_soon" },

  // Quality
  { id: "a11y", category: "Quality", label: "Accessibility", helper: "WCAG 2.2 checks, ARIA, keyboard", status: "coming_soon" },
  { id: "perf", category: "Quality", label: "Performance", helper: "Budget, LCP, CLS, render cost", status: "coming_soon" },
  { id: "darkmode", category: "Quality", label: "Dark mode", helper: "Surface hierarchy, contrast in dark UI", status: "coming_soon" },
];

export const CATEGORIES: Array<Tile["category"]> = [
  "Foundation",
  "Components",
  "Patterns",
  "Content",
  "Quality",
];
