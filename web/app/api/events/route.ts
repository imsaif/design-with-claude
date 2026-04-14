import { NextRequest } from "next/server";
import { recordEvent } from "@/lib/dwc/store";
import { isTokenShapeValid } from "@/lib/dwc/tokens";
import { isValidSlug } from "@/lib/dwc/projects";
import type { EventPayload } from "@/lib/dwc/types";

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
  if (!token || !toolName || !isTokenShapeValid(token)) {
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
  if (projectAutoCreated) headers.set("X-Dwc-Project-Auto-Created", "1");

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
