"use client";
import { useMemo, useState } from "react";
import { RenderOutput } from "./renderers";
import { EmptySection } from "./EmptySection";
import type {
  CopyData,
  ComponentSpecData,
  MarkdownData,
  PaletteData,
  SpacingData,
  ToolOutputPayload,
  TypeScaleData,
} from "@/lib/dwc/types";

interface StoredEvent {
  id: string;
  receivedAt: string;
  toolName: string;
  output: unknown;
  timestamp: string;
}

interface OnboardingHint {
  product_type?: string;
  product_description?: string;
  tech_stack?: string[];
  design_system?: string;
}

interface Props {
  events: StoredEvent[];
  onboarding?: OnboardingHint;
}

const VALID_TYPES = ["palette", "type-scale", "spacing", "component-spec", "copy", "markdown"] as const;
type ValidType = (typeof VALID_TYPES)[number];

function isToolOutput(o: unknown): o is ToolOutputPayload {
  if (!o || typeof o !== "object") return false;
  const type = (o as { type?: unknown }).type;
  return typeof type === "string" && VALID_TYPES.includes(type as ValidType);
}

function latestOf<T extends ToolOutputPayload["type"]>(
  events: StoredEvent[],
  type: T,
): { event: StoredEvent; output: Extract<ToolOutputPayload, { type: T }> } | null {
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i];
    if (isToolOutput(e.output) && e.output.type === type) {
      return { event: e, output: e.output as Extract<ToolOutputPayload, { type: T }> };
    }
  }
  return null;
}

function shortDescription(onboarding?: OnboardingHint): string {
  const desc = onboarding?.product_description?.trim();
  if (desc) {
    return desc.length > 90 ? desc.slice(0, 88) + "…" : desc;
  }
  return "your product";
}

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return `${Math.max(0, Math.round(ms / 1000))}s ago`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.round(ms / 3_600_000)}h ago`;
  return new Date(iso).toLocaleDateString();
}

export function SystemCanvas({ events, onboarding }: Props) {
  const palette = useMemo(() => latestOf(events, "palette"), [events]);
  const typescale = useMemo(() => latestOf(events, "type-scale"), [events]);
  const spacing = useMemo(() => latestOf(events, "spacing"), [events]);

  // "Decisions & notes" — markdown + component-spec + copy, chronological,
  // newest first. These don't replace each other; guidance accumulates.
  const decisions = useMemo(() => {
    return events
      .filter(
        (e) =>
          isToolOutput(e.output) &&
          (e.output.type === "markdown" ||
            e.output.type === "component-spec" ||
            e.output.type === "copy"),
      )
      .slice()
      .reverse();
  }, [events]);

  const product = shortDescription(onboarding);

  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      <Section
        title="Color"
        meta={palette ? `${palette.output.data.name} · updated ${formatRelative(palette.event.receivedAt)}` : null}
        latestId={palette?.event.id}
      >
        {palette ? (
          <RenderOutput output={palette.output} />
        ) : (
          <EmptySection
            label="Color palette"
            helper="Your primary, neutral, and semantic colors will live here once your color specialist runs."
            promptHint={`Use the color-specialist tool from designwithclaude. Brief: ${product}`}
          />
        )}
      </Section>

      <Section
        title="Typography"
        meta={typescale ? `${typescale.output.data.name} · updated ${formatRelative(typescale.event.receivedAt)}` : null}
        latestId={typescale?.event.id}
      >
        {typescale ? (
          <RenderOutput output={typescale.output} />
        ) : (
          <EmptySection
            label="Type system"
            helper="A fluid scale with clamp() values, line-heights, and weights — rendered in live preview text."
            promptHint={`Use the typography-specialist tool from designwithclaude. Brief: ${product}`}
          />
        )}
      </Section>

      <Section
        title="Spacing"
        meta={spacing ? `${spacing.output.data.name} · updated ${formatRelative(spacing.event.receivedAt)}` : null}
        latestId={spacing?.event.id}
      >
        {spacing ? (
          <RenderOutput output={spacing.output} />
        ) : (
          <EmptySection
            label="Spacing scale"
            helper="A non-linear scale that keeps rhythm without bloat — drop straight into Tailwind or CSS vars."
            promptHint={`Use the spacing-specialist tool from designwithclaude. Brief: ${product}`}
          />
        )}
      </Section>

      <Section
        title="Decisions & notes"
        meta={decisions.length ? `${decisions.length} entr${decisions.length === 1 ? "y" : "ies"}` : null}
      >
        {decisions.length === 0 ? (
          <EmptySection
            label="Briefs, components, copy"
            helper="Output from design-brief, component specs, and copy lives here as it accumulates. Newest on top."
            promptHint={`Use the design-brief tool from designwithclaude. Brief: ${product}`}
          />
        ) : (
          <DecisionsList items={decisions} />
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  meta,
  latestId,
  children,
}: {
  title: string;
  meta: string | null;
  latestId?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: "#0a0a0b",
        border: latestId ? "1px solid rgba(200,240,122,0.18)" : "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        padding: "1.25rem 1.5rem",
        transition: "border-color 200ms ease",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: "1rem",
          marginBottom: "1rem",
          paddingBottom: "0.6rem",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <h2
          style={{
            fontSize: "0.78rem",
            textTransform: "uppercase",
            letterSpacing: "0.16em",
            color: "rgba(255,255,255,0.85)",
            fontWeight: 600,
          }}
        >
          {title}
        </h2>
        {meta ? (
          <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>{meta}</span>
        ) : null}
      </header>
      {children}
    </section>
  );
}

function DecisionsList({ items }: { items: StoredEvent[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(items[0]?.id ?? null);
  return (
    <div style={{ display: "grid", gap: "0.5rem" }}>
      {items.map((item) => {
        const output = item.output as ToolOutputPayload;
        const isOpen = expandedId === item.id;
        const summary = decisionSummary(output);
        return (
          <article
            key={item.id}
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              background: "#0F0F10",
              overflow: "hidden",
            }}
          >
            <button
              type="button"
              onClick={() => setExpandedId(isOpen ? null : item.id)}
              style={{
                width: "100%",
                textAlign: "left",
                background: "transparent",
                border: "none",
                color: "inherit",
                cursor: "pointer",
                padding: "0.7rem 0.95rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.75rem",
                fontFamily: "inherit",
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  fontSize: "0.85rem",
                  color: "#fff",
                  minWidth: 0,
                }}
              >
                <span
                  style={{
                    fontSize: "0.65rem",
                    color: "#c8f07a",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontWeight: 600,
                  }}
                >
                  {output.type}
                </span>
                <span
                  style={{
                    color: "rgba(255,255,255,0.85)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {summary}
                </span>
              </span>
              <span
                style={{
                  fontSize: "0.7rem",
                  color: "rgba(255,255,255,0.45)",
                  fontFamily: "var(--font-geist-mono)",
                  flexShrink: 0,
                }}
              >
                {formatRelative(item.receivedAt)} {isOpen ? "▴" : "▾"}
              </span>
            </button>
            {isOpen ? (
              <div
                style={{
                  padding: "0 1rem 1rem",
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <div style={{ paddingTop: "0.85rem" }}>
                  <RenderOutput output={output} />
                </div>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

function decisionSummary(output: ToolOutputPayload): string {
  if (output.type === "markdown") {
    const md = output.data as MarkdownData;
    return md.title || md.content.slice(0, 80);
  }
  if (output.type === "component-spec") {
    const cs = output.data as ComponentSpecData;
    return cs.name || "Component spec";
  }
  if (output.type === "copy") {
    const c = output.data as CopyData;
    return `${c.context || "Copy"} (${c.tone || "tone"})`;
  }
  // The other branches are filtered out before they reach this list.
  const fallbackPalette = output.data as PaletteData | TypeScaleData | SpacingData;
  return (fallbackPalette as { name?: string }).name ?? output.type;
}
