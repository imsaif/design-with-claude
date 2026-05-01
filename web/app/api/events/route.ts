import { NextRequest } from "next/server";
import { recordEvent, recordAnonymousEvent } from "@/lib/dwic/store";
import {
  ANONYMOUS_TOOL_ALLOWLIST,
  isAnonymousTokenShapeValid,
  isTokenShapeValid,
} from "@/lib/dwic/tokens";
import { isValidSlug } from "@/lib/dwic/projects";
import type { EventPayload } from "@/lib/dwic/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: Partial<EventPayload>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, reason: "invalid_json" }, { status: 400 });
  }

  const token = body?.token?.trim();
  const toolName = body?.toolName?.trim();
  if (!token || !toolName) {
    return Response.json({ ok: false, reason: "invalid_token" }, { status: 200 });
  }

  // Anonymous CLI telemetry path: allowlisted tool names only, no project
  // resolution, no account row created.
  if (isAnonymousTokenShapeValid(token)) {
    if (!ANONYMOUS_TOOL_ALLOWLIST.has(toolName)) {
      return Response.json({ ok: false, reason: "anonymous_tool_not_allowed" }, { status: 200 });
    }
    const { id } = await recordAnonymousEvent({
      token,
      toolName,
      input: body.input ?? {},
      output: body.output ?? {},
      timestamp: body.timestamp ?? new Date().toISOString(),
    });
    return Response.json({ ok: true, id, anonymous: true }, { status: 200 });
  }

  if (!isTokenShapeValid(token)) {
    return Response.json({ ok: false, reason: "invalid_token" }, { status: 200 });
  }

  const rawProject = body?.project?.trim();
  if (rawProject && !isValidSlug(rawProject)) {
    return Response.json({ ok: false, reason: "invalid_project_slug" }, { status: 400 });
  }

  const { stored, projectAutoCreated } = await recordEvent({
    token,
    toolName,
    input: body.input ?? {},
    output: body.output ?? {},
    timestamp: body.timestamp ?? new Date().toISOString(),
    project: rawProject || undefined,
  });

  const headers = new Headers({ "Content-Type": "application/json" });
  if (projectAutoCreated) headers.set("X-Dwic-Project-Auto-Created", "1");

  return new Response(
    JSON.stringify({
      ok: true,
      id: stored.id,
      project: stored.project,
      projectAutoCreated,
    }),
    { status: 200, headers },
  );
}
