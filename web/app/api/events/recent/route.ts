import { NextRequest } from "next/server";
import { getOrCreateProfile, getRecentEvents } from "@/lib/dwc/store";
import { isTokenShapeValid } from "@/lib/dwc/tokens";
import { isValidSlug, normalizeSlug } from "@/lib/dwc/projects";

export const runtime = "nodejs";

/**
 * Companion polling endpoint. Scoped by project.
 * If no project query param is provided, we fall back to the default slug (via
 * normalizeSlug) so existing alpha.1 clients continue working. Phase 4 flips
 * DWC_ALLOW_IMPLICIT_PROJECT off and this call 400s without an explicit project.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim() ?? "";
  const rawProject = request.nextUrl.searchParams.get("project")?.trim();
  const limitRaw = request.nextUrl.searchParams.get("limit");
  const limit = limitRaw ? Math.min(200, Math.max(1, Number(limitRaw) || 50)) : 50;

  if (!isTokenShapeValid(token)) {
    return Response.json({ ok: false, reason: "invalid_token" }, { status: 400 });
  }
  if (rawProject && !isValidSlug(rawProject)) {
    return Response.json({ ok: false, reason: "invalid_project_slug" }, { status: 400 });
  }

  const slug = normalizeSlug(rawProject);
  if (!slug) {
    return Response.json(
      {
        ok: false,
        reason: "project_required",
        message: "Add ?project=<slug> to this request.",
      },
      { status: 400 },
    );
  }

  // Use getOrCreateProfile so the 'default' slug backfills transparently for
  // alpha.1 MCP clients that aren't yet sending a project.
  const [profile, events] = await Promise.all([
    getOrCreateProfile(token, slug),
    getRecentEvents(token, slug, limit),
  ]);

  return Response.json({
    ok: true,
    profile: profile
      ? {
          status: profile.status,
          commandCount: profile.commandCount,
          connected: profile.connected,
          createdAt: profile.createdAt,
          lastSeenAt: profile.lastSeenAt,
          onboarding: profile.onboarding,
          project: profile.project,
          projectDisplayName: profile.projectDisplayName,
        }
      : null,
    events,
  });
}
