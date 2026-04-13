import { NextRequest } from "next/server";
import { recordEvent } from "@/lib/dwc/store";
import { isTokenShapeValid } from "@/lib/dwc/tokens";
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

  const stored = recordEvent({
    token,
    toolName,
    input: body.input ?? {},
    output: body.output ?? {},
    timestamp: body.timestamp ?? new Date().toISOString(),
  });

  return Response.json({ ok: true, id: stored.id });
}
