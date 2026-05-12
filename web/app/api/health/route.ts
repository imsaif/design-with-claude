import { getSupabase, supabaseConfigured, formatSupabaseError } from "@/lib/dwic/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();

  if (!supabaseConfigured()) {
    return Response.json(
      { ok: false, reason: "supabase_not_configured" },
      { status: 503 },
    );
  }

  const supabase = getSupabase();
  if (!supabase) {
    return Response.json({ ok: false, reason: "supabase_client_unavailable" }, { status: 503 });
  }

  try {
    const { error } = await supabase
      .from("profiles")
      .select("id", { head: true, count: "exact" })
      .limit(1);
    if (error) {
      return Response.json(
        { ok: false, reason: "supabase_query_failed", detail: error.message },
        { status: 503 },
      );
    }
    return Response.json({
      ok: true,
      supabase: "reachable",
      latencyMs: Date.now() - startedAt,
    });
  } catch (err) {
    return Response.json(
      { ok: false, reason: "supabase_unreachable", detail: formatSupabaseError(err) },
      { status: 503 },
    );
  }
}
