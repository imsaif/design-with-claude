import { NextRequest } from "next/server";
import { getOrCreateProfile } from "@/lib/dwc/store";
import { isTokenShapeValid } from "@/lib/dwc/tokens";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: { token?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ valid: false, reason: "invalid_json" }, { status: 400 });
  }

  const token = body?.token?.trim();
  if (!isTokenShapeValid(token)) {
    return Response.json(
      { valid: false, reason: "invalid_token_format" },
      { status: 400 },
    );
  }

  const profile = await getOrCreateProfile(token!);
  return Response.json({
    valid: true,
    status: profile.status,
    connected: profile.connected,
    commandCount: profile.commandCount,
  });
}
