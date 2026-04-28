"use client";

import { useState, useEffect, useCallback } from "react";

type Signup = {
  token_hash: string;
  email: string;
  status: string;
  command_count: number;
  created_at: string;
  last_seen_at: string;
};

type Pagination = { page: number; limit: number; total: number; totalPages: number };
type Stats = { total: number; paid: number; free: number };

export default function SignupsClient({ initialAuth = false }: { initialAuth?: boolean }) {
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuth);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [signups, setSignups] = useState<Signup[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSignups = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ page: String(page), limit: "50" });
        if (statusFilter !== "all") params.set("status", statusFilter);
        if (searchQuery) params.set("search", searchQuery);
        const res = await fetch(`/api/admin/signups?${params}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to fetch signups");
          return;
        }
        setSignups(data.signups);
        setPagination(data.pagination);
        if (data.stats) setStats(data.stats);
      } catch {
        setError("Failed to fetch signups");
      } finally {
        setIsLoading(false);
      }
    },
    [statusFilter, searchQuery],
  );

  useEffect(() => {
    if (isAuthenticated) fetchSignups(1);
  }, [isAuthenticated, fetchSignups]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setIsAuthenticated(true);
        setPassword("");
      } else {
        const data = await res.json();
        setAuthError(data.error || "Invalid password");
      }
    } catch {
      setAuthError("Login failed. Please try again.");
    }
  };

  const exportCsv = async () => {
    const params = new URLSearchParams({ limit: "10000" });
    if (statusFilter !== "all") params.set("status", statusFilter);
    const res = await fetch(`/api/admin/signups?${params}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to export");
      return;
    }
    const csv = [
      "Email,Status,Commands,Created At,Last Seen",
      ...data.signups.map(
        (s: Signup) =>
          `${s.email},${s.status},${s.command_count},${s.created_at},${s.last_seen_at}`,
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dwic-signups-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="mb-6 text-2xl font-bold text-slate-900">Admin login</h1>
          <form onSubmit={handleAuth}>
            <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              className="w-full rounded-md border border-slate-300 px-4 py-2 text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
              placeholder="Enter admin password"
            />
            {authError && <p className="mt-2 text-sm text-red-600">{authError}</p>}
            <button
              type="submit"
              className="mt-4 w-full rounded-md bg-slate-900 px-4 py-2 text-white transition-colors hover:bg-slate-800"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Signups</h1>
          <p className="mt-1 text-sm text-slate-600">
            {stats ? (
              <>
                <span className="font-medium text-slate-900">{stats.total}</span> total
                <span className="mx-2 text-slate-400">·</span>
                <span className="text-emerald-700">{stats.paid} paid</span>
                <span className="mx-2 text-slate-400">·</span>
                <span className="text-slate-600">{stats.free} free</span>
              </>
            ) : (
              "Email submissions from /get-started"
            )}
          </p>
        </div>
        <button
          onClick={exportCsv}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white transition-colors hover:bg-slate-800"
        >
          Export CSV
        </button>
      </header>

      {error && (
        <div className="mb-6 flex items-center justify-between gap-2 rounded-md bg-red-50 p-4 text-red-700">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-700">
            ✕
          </button>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <input
          type="text"
          placeholder="Search by email…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") setSearchQuery(searchInput);
          }}
          className="min-w-[220px] flex-1 rounded-md border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
        >
          <option value="all">All statuses</option>
          <option value="free">Free</option>
          <option value="paid">Paid</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button
          onClick={() => setSearchQuery(searchInput)}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white transition-colors hover:bg-slate-800"
        >
          Search
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading signups…</div>
        ) : signups.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No signups found</div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                  Commands
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                  Last seen
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {signups.map((s) => (
                <tr key={s.token_hash} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm text-slate-900">{s.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        s.status === "paid"
                          ? "bg-emerald-100 text-emerald-700"
                          : s.status === "cancelled"
                          ? "bg-red-100 text-red-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">{s.command_count}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(s.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(s.last_seen_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
            <p className="text-sm text-slate-600">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
              {pagination.total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => fetchSignups(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="rounded-md border border-slate-300 px-3 py-1 text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-slate-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchSignups(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="rounded-md border border-slate-300 px-3 py-1 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
