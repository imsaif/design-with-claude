import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/admin-auth";
import { formatSupabaseError, getSupabase, supabaseConfigured } from "@/lib/dwic/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EventRow = {
  id: string;
  token_hash: string;
  tool_name: string;
  input: unknown;
  output: unknown;
  event_timestamp: string;
  received_at: string;
};

const SINCE_PRESETS: Record<string, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

export const GET = withAdminAuth<unknown>(async (request: NextRequest) => {
  if (!supabaseConfigured()) {
    return NextResponse.json(
      {
        error:
          "Supabase not configured. Set DWIC_SUPABASE_URL and DWIC_SUPABASE_SERVICE_ROLE_KEY to view events.",
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
  const tool = url.searchParams.get("tool") || "all";
  const tokenSearch = url.searchParams.get("token")?.trim() || "";
  const since = url.searchParams.get("since") || "all";

  let query = sb
    .from("companion_events")
    .select("id, token_hash, tool_name, input, output, event_timestamp, received_at", {
      count: "exact",
    })
    .order("received_at", { ascending: false });

  if (tool !== "all") query = query.eq("tool_name", tool);
  if (tokenSearch) query = query.ilike("token_hash", `%${tokenSearch}%`);
  if (since !== "all" && SINCE_PRESETS[since]) {
    const cutoff = new Date(Date.now() - SINCE_PRESETS[since]).toISOString();
    query = query.gte("received_at", cutoff);
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  let data: EventRow[] | null = null;
  let total = 0;
  let totalCount = 0;
  let count24h = 0;
  let count7d = 0;
  const toolSet = new Set<string>();
  try {
    const result = await query.range(from, to);
    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }
    data = result.data as EventRow[] | null;
    total = result.count ?? 0;

    const cutoff24h = new Date(Date.now() - SINCE_PRESETS["24h"]).toISOString();
    const cutoff7d = new Date(Date.now() - SINCE_PRESETS["7d"]).toISOString();
    const counts = await Promise.all([
      sb.from("companion_events").select("id", { count: "exact", head: true }),
      sb
        .from("companion_events")
        .select("id", { count: "exact", head: true })
        .gte("received_at", cutoff24h),
      sb
        .from("companion_events")
        .select("id", { count: "exact", head: true })
        .gte("received_at", cutoff7d),
    ]);
    totalCount = counts[0].count ?? 0;
    count24h = counts[1].count ?? 0;
    count7d = counts[2].count ?? 0;

    // Cheap distinct-tool list off recent rows for the filter dropdown.
    const recent = await sb
      .from("companion_events")
      .select("tool_name")
      .order("received_at", { ascending: false })
      .limit(500);
    (recent.data ?? []).forEach((r) => toolSet.add(r.tool_name));
    (data ?? []).forEach((r) => toolSet.add(r.tool_name));
  } catch (err) {
    return NextResponse.json({ error: formatSupabaseError(err) }, { status: 502 });
  }

  return NextResponse.json({
    events: data ?? [],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
    stats: {
      total: totalCount,
      last24h: count24h,
      last7d: count7d,
    },
    toolNames: Array.from(toolSet).sort(),
  });
});
