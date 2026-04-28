import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/admin-auth";
import { getSupabase, supabaseConfigured } from "@/lib/dwic/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SignupRow = {
  token_hash: string;
  email: string;
  status: string;
  command_count: number;
  created_at: string;
  last_seen_at: string;
};

export const GET = withAdminAuth<unknown>(async (request: NextRequest) => {
  if (!supabaseConfigured()) {
    return NextResponse.json(
      {
        error:
          "Supabase not configured. Set DWIC_SUPABASE_URL and DWIC_SUPABASE_SERVICE_ROLE_KEY to view signups.",
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

  let query = sb
    .from("profiles")
    .select("token_hash, email, status, command_count, created_at, last_seen_at", {
      count: "exact",
    })
    .not("email", "is", null)
    .order("created_at", { ascending: false });

  if (search) query = query.ilike("email", `%${search}%`);
  if (status !== "all") query = query.eq("status", status);

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const { data, error, count } = await query.range(from, to);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const [{ count: totalSignups }, { count: paidCount }] = await Promise.all([
    sb
      .from("profiles")
      .select("token_hash", { count: "exact", head: true })
      .not("email", "is", null),
    sb
      .from("profiles")
      .select("token_hash", { count: "exact", head: true })
      .not("email", "is", null)
      .eq("status", "paid"),
  ]);

  const total = count ?? 0;
  return NextResponse.json({
    signups: (data ?? []) as SignupRow[],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
    stats: {
      total: totalSignups ?? 0,
      paid: paidCount ?? 0,
      free: (totalSignups ?? 0) - (paidCount ?? 0),
    },
  });
});
