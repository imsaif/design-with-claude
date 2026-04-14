"use client";
import { useMemo, useState } from "react";
import { RenderOutput } from "./renderers";
import { CopyButton } from "./CopyButton";
import { CATEGORIES, TILES, type Tile } from "./canvasTiles";
import type {
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
  product_description?: string;
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

/** Find the latest event whose output matches a tile's expected output kind (and
 *  optional shape-matcher). Returns both the event and the typed payload. */
function latestForTile(
  events: StoredEvent[],
  tile: Tile,
): { event: StoredEvent; output: ToolOutputPayload } | null {
  if (!tile.outputKind) return null;
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i];
    if (!isToolOutput(e.output)) continue;
    if (e.output.type !== tile.outputKind) continue;
    if (tile.matches && !tile.matches(e.output)) continue;
    return { event: e, output: e.output };
  }
  return null;
}

function shortDescription(onboarding?: OnboardingHint): string {
  const desc = onboarding?.product_description?.trim();
  if (!desc) return "your product";
  return desc.length > 80 ? desc.slice(0, 78) + "…" : desc;
}

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return `${Math.max(0, Math.round(ms / 1000))}s ago`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.round(ms / 3_600_000)}h ago`;
  return new Date(iso).toLocaleDateString();
}

export function SystemCanvas({ events, onboarding }: Props) {
  const product = shortDescription(onboarding);
  // Only one tile can be expanded at a time — keeps the grid readable and
  // makes the "click again to collapse" behavior obvious.
  const [expandedTileId, setExpandedTileId] = useState<string | null>(null);
  const tilesByCategory = useMemo(() => {
    const map = new Map<Tile["category"], Tile[]>();
    for (const cat of CATEGORIES) map.set(cat, []);
    for (const tile of TILES) map.get(tile.category)!.push(tile);
    return map;
  }, []);

  // Narrative outputs (markdown, component-spec, copy) that don't map to a
  // specific tile accumulate in a single "Decisions & notes" section below.
  // We exclude the architecture tile's markdown so it doesn't show up twice.
  const narrative = useMemo(() => {
    const archTile = TILES.find((t) => t.id === "architecture");
    return events
      .filter((e) => {
        if (!isToolOutput(e.output)) return false;
        const payload = e.output;
        if (payload.type === "markdown" && archTile?.matches?.(payload)) return false;
        return payload.type === "markdown" || payload.type === "component-spec" || payload.type === "copy";
      })
      .slice()
      .reverse();
  }, [events]);

  return (
    <div style={{ display: "grid", gap: "2rem" }}>
      {CATEGORIES.map((cat) => {
        const tiles = tilesByCategory.get(cat) ?? [];
        return (
          <section key={cat}>
            <h2
              style={{
                fontSize: "0.72rem",
                textTransform: "uppercase",
                letterSpacing: "0.16em",
                color: "rgba(255,255,255,0.55)",
                fontWeight: 600,
                marginBottom: "0.85rem",
              }}
            >
              {cat}
            </h2>
            <div
              style={{
                display: "grid",
                gap: "0.75rem",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              }}
            >
              {tiles.map((tile) => {
                const filled = latestForTile(events, tile);
                return (
                  <TileCard
                    key={tile.id}
                    tile={tile}
                    filled={filled}
                    product={product}
                    isExpanded={expandedTileId === tile.id}
                    onToggleExpand={() =>
                      setExpandedTileId((prev) => (prev === tile.id ? null : tile.id))
                    }
                  />
                );
              })}
            </div>
          </section>
        );
      })}

      <section>
        <h2
          style={{
            fontSize: "0.72rem",
            textTransform: "uppercase",
            letterSpacing: "0.16em",
            color: "rgba(255,255,255,0.55)",
            fontWeight: 600,
            marginBottom: "0.85rem",
          }}
        >
          Decisions & notes
        </h2>
        {narrative.length === 0 ? (
          <div
            style={{
              border: "1px dashed rgba(255,255,255,0.1)",
              borderRadius: 12,
              padding: "1.25rem 1.5rem",
              background: "rgba(255,255,255,0.015)",
            }}
          >
            <div
              style={{
                fontSize: "0.7rem",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "rgba(255,255,255,0.45)",
                marginBottom: "0.4rem",
              }}
            >
              Briefs, components, copy · nothing yet
            </div>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.9rem", marginBottom: "0.75rem" }}>
              Output from design-brief, component specs, and copy accumulates here. Newest on top.
            </p>
            <PromptChip prompt={`Use the design-brief tool from designwithclaude. Brief: ${product}`} />
          </div>
        ) : (
          <DecisionsList items={narrative} />
        )}
      </section>
    </div>
  );
}

function TileCard({
  tile,
  filled,
  product,
  isExpanded,
  onToggleExpand,
}: {
  tile: Tile;
  filled: { event: StoredEvent; output: ToolOutputPayload } | null;
  product: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const isFilled = Boolean(filled);
  const isComingSoon = tile.status === "coming_soon" && !isFilled;
  const isActive = !isComingSoon;
  const canExpand = isFilled;
  const expanded = isExpanded && canExpand;

  const border = expanded
    ? "1px solid rgba(200,240,122,0.55)"
    : isFilled
      ? "1px solid rgba(200,240,122,0.35)"
      : isComingSoon
        ? "1px solid rgba(255,255,255,0.05)"
        : "1px dashed rgba(255,255,255,0.14)";

  const bg = isComingSoon
    ? "rgba(255,255,255,0.01)"
    : expanded
      ? "#0a0a0b"
      : isFilled
        ? "rgba(200,240,122,0.04)"
        : "rgba(255,255,255,0.02)";

  return (
    <article
      style={{
        border,
        background: bg,
        borderRadius: 12,
        padding: expanded ? "1.25rem 1.5rem" : "0.9rem 1rem",
        minHeight: expanded ? undefined : 132,
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        opacity: isComingSoon ? 0.55 : 1,
        // Span every column of the parent grid when expanded so the full
        // renderer has real estate; tiles below reflow naturally.
        gridColumn: expanded ? "1 / -1" : "auto",
        transition: "border-color 160ms ease, background 160ms ease, padding 160ms ease",
        boxShadow: expanded ? "0 12px 30px rgba(0,0,0,0.35)" : undefined,
      }}
    >
      <header style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span
          aria-hidden
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: isFilled ? "#c8f07a" : isComingSoon ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.35)",
            boxShadow: isFilled ? "0 0 8px rgba(200,240,122,0.6)" : "none",
          }}
        />
        <h3
          style={{
            fontSize: expanded ? "1rem" : "0.88rem",
            fontWeight: 600,
            color: "#fff",
            flex: 1,
          }}
        >
          {tile.label}
        </h3>
        {isComingSoon ? (
          <span
            style={{
              fontSize: "0.62rem",
              color: "rgba(255,255,255,0.45)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            soon
          </span>
        ) : isFilled ? (
          <span
            style={{
              fontSize: "0.65rem",
              color: "#c8f07a",
              fontFamily: "var(--font-geist-mono)",
            }}
          >
            {formatRelative(filled!.event.receivedAt)}
          </span>
        ) : null}
      </header>

      {!expanded ? (
        <p
          style={{
            fontSize: "0.78rem",
            color: "rgba(255,255,255,0.6)",
            lineHeight: 1.4,
            flex: 1,
          }}
        >
          {tile.helper}
        </p>
      ) : null}

      {isFilled && !expanded ? <TilePreview output={filled!.output} /> : null}

      {canExpand ? (
        <button
          type="button"
          onClick={onToggleExpand}
          style={{
            background: "transparent",
            border: "none",
            color: "#c8f07a",
            fontSize: "0.72rem",
            padding: 0,
            cursor: "pointer",
            textAlign: "left",
            fontFamily: "inherit",
            alignSelf: "flex-start",
          }}
        >
          {expanded ? "← Collapse" : "Open full view →"}
        </button>
      ) : null}

      {expanded && filled ? (
        <div style={{ marginTop: "0.5rem" }}>
          <RenderOutput output={filled.output} />
        </div>
      ) : null}

      {!isFilled && isActive && tile.tool ? (
        <PromptChip
          prompt={`Use the ${tile.tool} tool from designwithclaude. Brief: ${product}`}
        />
      ) : null}
    </article>
  );
}

function TilePreview({ output }: { output: ToolOutputPayload }) {
  if (output.type === "palette") {
    const tokens = (output.data as PaletteData).tokens.slice(0, 8);
    return (
      <div style={{ display: "flex", gap: 4, marginTop: "0.1rem" }}>
        {tokens.map((t, i) => (
          <span
            key={i}
            title={`${t.name} · ${t.hex}`}
            style={{
              width: 18,
              height: 18,
              borderRadius: 4,
              background: t.hex,
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          />
        ))}
      </div>
    );
  }
  if (output.type === "type-scale") {
    const scale = (output.data as TypeScaleData).scale;
    const display = scale.find((s) => s.role === "display") ?? scale[0];
    const body = scale.find((s) => s.role === "body") ?? scale[scale.length - 1];
    return (
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ fontSize: display.clamp, fontWeight: display.weight, color: "#fff" }}>
          Aa
        </span>
        <span style={{ fontSize: body.clamp, color: "rgba(255,255,255,0.6)" }}>abc</span>
      </div>
    );
  }
  if (output.type === "spacing") {
    const steps = (output.data as SpacingData).steps;
    const max = Math.max(...steps.map((s) => s.px), 1);
    const sample = [steps[2], steps[4], steps[6], steps[8]].filter(Boolean);
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {sample.map((s, i) => (
          <span
            key={i}
            title={`${s.name} · ${s.px}px`}
            style={{
              height: 6,
              width: `${Math.max(6, (s.px / max) * 56)}px`,
              background: "rgba(200,240,122,0.45)",
              borderRadius: 2,
            }}
          />
        ))}
      </div>
    );
  }
  if (output.type === "markdown") {
    const md = output.data as MarkdownData;
    return (
      <p
        style={{
          fontSize: "0.72rem",
          color: "rgba(255,255,255,0.6)",
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          margin: 0,
        }}
      >
        {md.title}
      </p>
    );
  }
  return null;
}

function PromptChip({ prompt }: { prompt: string }) {
  return (
    <div
      style={{
        background: "#0F0F10",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 8,
        padding: "0.55rem 0.6rem",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "0.5rem",
        fontFamily: "var(--font-geist-mono), SF Mono, monospace",
        fontSize: "0.68rem",
        color: "rgba(255,255,255,0.7)",
        lineHeight: 1.5,
      }}
    >
      <span style={{ flex: 1, minWidth: 0 }}>{prompt}</span>
      <CopyButton text={prompt} label="Copy" compact />
    </div>
  );
}

function DecisionsList({ items }: { items: StoredEvent[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(items[0]?.id ?? null);
  return (
    <div style={{ display: "grid", gap: "0.5rem" }}>
      {items.map((item) => {
        const output = item.output as ToolOutputPayload;
        const isOpen = expandedId === item.id;
        let summary: string = output.type;
        if (output.type === "markdown") {
          summary = output.data.title || output.data.content.slice(0, 80);
        } else if (output.type === "component-spec") {
          summary = output.data.name || "Component spec";
        } else if (output.type === "copy") {
          summary = `${output.data.context || "Copy"} (${output.data.tone || "tone"})`;
        }
        return (
          <article
            key={item.id}
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              background: "#0a0a0b",
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
              <span style={{ display: "flex", alignItems: "center", gap: "0.6rem", minWidth: 0 }}>
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
                    fontSize: "0.85rem",
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
              <div style={{ padding: "0 1rem 1rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
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
