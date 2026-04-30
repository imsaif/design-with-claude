"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AuthGate,
  ErrorBanner,
  PageHeader,
  Pill,
  StatBand,
  TableShell,
  fmtDate,
  fmtRelative,
  styles as s,
  tokenSuffix,
} from "../_ui";

type Subscriber = {
  token_hash: string;
  email: string | null;
  status: string;
  command_count: number;
  connected: boolean;
  created_at: string;
  last_seen_at: string;
};

type Pagination = { page: number; limit: number; total: number; totalPages: number };
type Stats = { total: number; active: number; connected: number; paid: number };

const statusTone = (status: string): "success" | "danger" | "neutral" =>
  status === "paid" ? "success" : status === "cancelled" ? "danger" : "neutral";

export default function SubscribersClient({ initialAuth = false }: { initialAuth?: boolean }) {
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuth);
  const [rows, setRows] = useState<Subscriber[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [connectedFilter, setConnectedFilter] = useState("all");
  const [activeOnly, setActiveOnly] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRows = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ page: String(page), limit: "50" });
        if (statusFilter !== "all") params.set("status", statusFilter);
        if (connectedFilter !== "all") params.set("connected", connectedFilter);
        params.set("active", activeOnly ? "true" : "false");
        if (searchQuery) params.set("search", searchQuery);
        const res = await fetch(`/api/admin/subscribers?${params}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to fetch subscribers");
          return;
        }
        setRows(data.subscribers);
        setPagination(data.pagination);
        if (data.stats) setStats(data.stats);
      } catch {
        setError("Failed to fetch subscribers");
      } finally {
        setIsLoading(false);
      }
    },
    [statusFilter, connectedFilter, activeOnly, searchQuery],
  );

  useEffect(() => {
    if (isAuthenticated) fetchRows(1);
  }, [isAuthenticated, fetchRows]);

  const exportCsv = async () => {
    const params = new URLSearchParams({ limit: "10000", active: activeOnly ? "true" : "false" });
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (connectedFilter !== "all") params.set("connected", connectedFilter);
    const res = await fetch(`/api/admin/subscribers?${params}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to export");
      return;
    }
    const csv = [
      "Token,Email,Status,Connected,Commands,Created,Last Seen",
      ...data.subscribers.map(
        (x: Subscriber) =>
          `${tokenSuffix(x.token_hash)},${x.email ?? ""},${x.status},${x.connected},${x.command_count},${x.created_at},${x.last_seen_at}`,
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dwic-subscribers-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isAuthenticated) return <AuthGate onAuthenticated={() => setIsAuthenticated(true)} />;

  const activeRate =
    stats && stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : null;

  return (
    <>
      <PageHeader
        eyebrow="Subscribers · imr_ tokens"
        title="Tokens & usage"
        description="Who we issued tokens to and whether they're using them."
        actions={
          <button className={s.btnPrimary} onClick={exportCsv}>
            Export CSV
          </button>
        }
      />

      {stats && (
        <StatBand
          items={[
            { label: "Total", value: stats.total, tone: "accent" },
            {
              label: "Active",
              value: stats.active,
              tone: "success",
              hint: activeRate != null ? `${activeRate}% of total` : "ran ≥1 command",
            },
            { label: "Connected", value: stats.connected, hint: "MCP linked" },
            { label: "Paid", value: stats.paid },
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
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setSearchQuery(searchInput);
            }}
            placeholder="Search by email or token…"
          />
        </div>
        <select
          className={s.select}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="free">Free</option>
          <option value="paid">Paid</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          className={s.select}
          value={connectedFilter}
          onChange={(e) => setConnectedFilter(e.target.value)}
        >
          <option value="all">Any connection</option>
          <option value="true">Connected</option>
          <option value="false">Not connected</option>
        </select>
        <button
          type="button"
          className={`${s.toggle} ${activeOnly ? s.toggleOn : ""}`}
          onClick={() => setActiveOnly(!activeOnly)}
        >
          <span className={s.toggleBox}>
            {activeOnly && (
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="#162036" strokeWidth="2.5">
                <path d="M2.5 6.5l2.5 2.5 4.5-5.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
          Active only
        </button>
        <button className={s.btnGhost} onClick={() => setSearchQuery(searchInput)}>
          Search
        </button>
      </div>

      <TableShell
        loading={isLoading}
        empty="No subscribers found"
        emptyHint="Try clearing filters or disabling 'Active only'."
        columns={[
          { label: "Token" },
          { label: "Email" },
          { label: "Status" },
          { label: "Connection" },
          { label: "Commands", align: "right" },
          { label: "Last seen" },
          { label: "Joined" },
        ]}
        rows={rows.map((x) => (
          <tr key={x.token_hash}>
            <td className={s.td}>
              <span className={`${s.mono} ${s.monoDim}`}>imr_…</span>
              <span className={s.mono} style={{ color: "#0F172A", fontWeight: 500 }}>
                {tokenSuffix(x.token_hash)}
              </span>
            </td>
            <td className={`${s.td} ${s.tdEmail}`}>
              {x.email || <span className={s.tdMuted}>—</span>}
            </td>
            <td className={s.td}>
              <Pill tone={statusTone(x.status)}>{x.status}</Pill>
            </td>
            <td className={s.td}>
              <span className={x.connected ? s.dotLive : s.dotOff}>
                {x.connected ? "Live" : "Offline"}
              </span>
            </td>
            <td className={`${s.td} ${s.tdRight}`}>
              <span
                className={`${s.mono} ${s.tnum}`}
                style={{ color: x.command_count > 0 ? "#0F172A" : "#CBD5E1" }}
              >
                {x.command_count}
              </span>
            </td>
            <td className={s.td} title={new Date(x.last_seen_at).toLocaleString()}>
              {fmtRelative(x.last_seen_at)}
            </td>
            <td className={`${s.td} ${s.tdMuted}`}>{fmtDate(x.created_at)}</td>
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
