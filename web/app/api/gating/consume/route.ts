import { NextRequest } from "next/server";
import { incrementCommandCount } from "@/lib/dwic/store";
import { isTokenShapeValid } from "@/lib/dwic/tokens";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: { token?: string; toolName?: string; project?: string };
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

  const { accountCount, projectCount } = await incrementCommandCount(
    token!,
    body?.project?.trim() || undefined,
  );
  return Response.json({ ok: true, commandCount: accountCount, projectCommandCount: projectCount });
}
