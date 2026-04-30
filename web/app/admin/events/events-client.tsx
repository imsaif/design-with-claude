"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AuthGate,
  ErrorBanner,
  PageHeader,
  StatBand,
  TableShell,
  fmtRelative,
  styles as s,
  tokenSuffix,
} from "../_ui";

type EventRow = {
  id: string;
  token_hash: string;
  tool_name: string;
  input: unknown;
  output: unknown;
  event_timestamp: string;
  received_at: string;
};

type Pagination = { page: number; limit: number; total: number; totalPages: number };
type Stats = { total: number; last24h: number; last7d: number };

const summarizeJson = (value: unknown, max = 100): string => {
  if (value == null) return "";
  try {
    const t = typeof value === "string" ? value : JSON.stringify(value);
    if (t.length <= max) return t;
    return t.slice(0, max) + "…";
  } catch {
    return "";
  }
};

export default function EventsClient({ initialAuth = false }: { initialAuth?: boolean }) {
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuth);
  const [rows, setRows] = useState<EventRow[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [toolNames, setToolNames] = useState<string[]>([]);
  const [toolFilter, setToolFilter] = useState("all");
  const [sinceFilter, setSinceFilter] = useState("7d");
  const [tokenSearch, setTokenSearch] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRows = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ page: String(page), limit: "50" });
        if (toolFilter !== "all") params.set("tool", toolFilter);
        if (sinceFilter !== "all") params.set("since", sinceFilter);
        if (tokenSearch) params.set("token", tokenSearch);
        const res = await fetch(`/api/admin/events?${params}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to fetch events");
          return;
        }
        setRows(data.events);
        setPagination(data.pagination);
        if (data.stats) setStats(data.stats);
        if (data.toolNames) setToolNames(data.toolNames);
      } catch {
        setError("Failed to fetch events");
      } finally {
        setIsLoading(false);
      }
    },
    [toolFilter, sinceFilter, tokenSearch],
  );

  useEffect(() => {
    if (isAuthenticated) fetchRows(1);
  }, [isAuthenticated, fetchRows]);

  if (!isAuthenticated) return <AuthGate onAuthenticated={() => setIsAuthenticated(true)} />;

  return (
    <>
      <PageHeader
        eyebrow="Events · companion_events"
        title="Tool invocations"
        description="Every MCP tool call from the dwic companion server, freshest first."
        actions={
          <button
            className={s.btnGhost}
            onClick={() => fetchRows(pagination?.page ?? 1)}
          >
            Refresh
          </button>
        }
      />

      {stats && (
        <StatBand
          items={[
            { label: "Last 24h", value: stats.last24h, tone: "accent" },
            { label: "Last 7d", value: stats.last7d },
            { label: "All time", value: stats.total, tone: "muted" },
          ]}
        />
      )}

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      <div className={s.filters}>
        <div className={s.search}>
          <span className={s.searchIcon} aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" strokeLinecap="round" />
            </svg>
          </span>
          <input
            type="text"
            className={s.searchInput}
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setTokenSearch(tokenInput);
            }}
            placeholder="Filter by token (any substring)…"
          />
        </div>
        <select
          className={s.select}
          value={toolFilter}
          onChange={(e) => setToolFilter(e.target.value)}
        >
          <option value="all">All tools</option>
          {toolNames.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          className={s.select}
          value={sinceFilter}
          onChange={(e) => setSinceFilter(e.target.value)}
        >
          <option value="24h">Last 24h</option>
          <option value="7d">Last 7d</option>
          <option value="30d">Last 30d</option>
          <option value="all">All time</option>
        </select>
        <button className={s.btnGhost} onClick={() => setTokenSearch(tokenInput)}>
          Search
        </button>
      </div>

      <TableShell
        loading={isLoading}
        empty="No events in this window"
        emptyHint="Try widening the time range or clearing the token filter."
        columns={[
          { label: "Tool" },
          { label: "Token" },
          { label: "Input" },
          { label: "When", align: "right" },
        ]}
        rows={rows.map((e) => (
          <tr key={e.id}>
            <td className={s.td}>
              <span className={s.pillMono + " " + s.pill}>{e.tool_name}</span>
            </td>
            <td className={s.td}>
              <span className={`${s.mono} ${s.monoDim}`}>imr_…</span>
              <span className={s.mono} style={{ color: "#334155" }}>
                {tokenSuffix(e.token_hash)}
              </span>
            </td>
            <td className={s.td}>
              {summarizeJson(e.input) ? (
                <span className={s.codeCell} title={summarizeJson(e.input, 4000)}>
                  {summarizeJson(e.input)}
                </span>
              ) : (
                <span className={s.tdMuted}>—</span>
              )}
            </td>
            <td className={`${s.td} ${s.tdRight}`} title={new Date(e.received_at).toLocaleString()}>
              {fmtRelative(e.received_at)}
            </td>
          </tr>
        ))}
        pagination={
          pagination
            ? {
                page: pagination.page,
                totalPages: pagination.totalPages,
                total: pagination.total,
                limit: pagination.limit,
                onPage: fetchRows,
              }
            : undefined
        }
      />
    </>
  );
}
