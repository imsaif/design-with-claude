import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/admin-auth";
import { formatSupabaseError, getSupabase, supabaseConfigured } from "@/lib/dwic/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SubscriberRow = {
  token_hash: string;
  email: string | null;
  status: string;
  command_count: number;
  connected: boolean;
  created_at: string;
  last_seen_at: string;
};

export const GET = withAdminAuth<unknown>(async (request: NextRequest) => {
  if (!supabaseConfigured()) {
    return NextResponse.json(
      {
        error:
          "Supabase not configured. Set DWIC_SUPABASE_URL and DWIC_SUPABASE_SERVICE_ROLE_KEY to view subscribers.",
      },
      { status: 503 },
    );
  }

  const sb = getSupabase();
  if (!sb) {
    return NextResponse.json({ error: "Supabase client unavailable" }, { status: 503 });
  }

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.min(500, Math.max(1, parseInt(url.searchParams.get("limit") || "50", 10)));
  const search = url.searchParams.get("search")?.trim() || "";
  const status = url.searchParams.get("status") || "all";
  const connected = url.searchParams.get("connected") || "all";
  const activeOnly = (url.searchParams.get("active") ?? "true") === "true";

  let query = sb
    .from("profiles")
    .select(
      "token_hash, email, status, command_count, connected, created_at, last_seen_at",
      { count: "exact" },
    )
    .order("last_seen_at", { ascending: false });

  if (search) {
    // Match either email substring or token_hash substring (last 8 chars typically pasted).
    query = query.or(`email.ilike.%${search}%,token_hash.ilike.%${search}%`);
  }
  if (status !== "all") query = query.eq("status", status);
  if (connected === "true") query = query.eq("connected", true);
  if (connected === "false") query = query.eq("connected", false);
  if (activeOnly) query = query.gt("command_count", 0);

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  let data: SubscriberRow[] | null = null;
  let total = 0;
  let totalCount = 0;
  let activeCount = 0;
  let connectedCount = 0;
  let paidCount = 0;
  try {
    const result = await query.range(from, to);
    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }
    data = result.data as SubscriberRow[] | null;
    total = result.count ?? 0;

    const counts = await Promise.all([
      sb.from("profiles").select("token_hash", { count: "exact", head: true }),
      sb
        .from("profiles")
        .select("token_hash", { count: "exact", head: true })
        .gt("command_count", 0),
      sb
        .from("profiles")
        .select("token_hash", { count: "exact", head: true })
        .eq("connected", true),
      sb
        .from("profiles")
        .select("token_hash", { count: "exact", head: true })
        .eq("status", "paid"),
    ]);
    totalCount = counts[0].count ?? 0;
    activeCount = counts[1].count ?? 0;
    connectedCount = counts[2].count ?? 0;
    paidCount = counts[3].count ?? 0;
  } catch (err) {
    return NextResponse.json({ error: formatSupabaseError(err) }, { status: 502 });
  }

  return NextResponse.json({
    subscribers: data ?? [],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
    stats: {
      total: totalCount,
      active: activeCount,
      connected: connectedCount,
      paid: paidCount,
    },
  });
});
