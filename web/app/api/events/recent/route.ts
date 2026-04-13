import { NextRequest } from "next/server";
import { getProfile, getRecentEvents } from "@/lib/dwc/store";
import { isTokenShapeValid } from "@/lib/dwc/tokens";

export const runtime = "nodejs";

// Debug / dev polling endpoint. Phase 2 companion will subscribe to
// Supabase Realtime instead of polling this.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim() ?? "";
  const limitRaw = request.nextUrl.searchParams.get("limit");
  const limit = limitRaw ? Math.min(200, Math.max(1, Number(limitRaw) || 50)) : 50;

  if (!isTokenShapeValid(token)) {
    return Response.json({ ok: false, reason: "invalid_token" }, { status: 400 });
  }

  const profile = getProfile(token);
  const events = getRecentEvents(token, limit);

  return Response.json({
    ok: true,
    profile: profile
      ? {
          status: profile.status,
          commandCount: profile.commandCount,
          connected: profile.connected,
          createdAt: profile.createdAt,
          lastSeenAt: profile.lastSeenAt,
        }
      : null,
    events,
  });
}
