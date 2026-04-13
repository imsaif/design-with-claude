import { NextRequest } from "next/server";
import { incrementCommandCount } from "@/lib/dwc/store";
import { isTokenShapeValid } from "@/lib/dwc/tokens";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: { token?: string; toolName?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, reason: "invalid_json" }, { status: 400 });
  }

  const token = body?.token?.trim();
  const toolName = body?.toolName?.trim();

  if (!isTokenShapeValid(token) || !toolName) {
    return Response.json({ ok: false, reason: "invalid_token" }, { status: 200 });
  }

  const count = incrementCommandCount(token!);
  return Response.json({ ok: true, commandCount: count });
}
