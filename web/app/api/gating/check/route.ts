import { NextRequest } from "next/server";
import {
  ensureAccount,
  freeTierRemaining,
  isFreeTierExhausted,
  LIMITS,
} from "@/lib/dwic/store";
import { isTokenShapeValid } from "@/lib/dwic/tokens";
import type { GatingCheckResponse } from "@/lib/dwic/types";

export const runtime = "nodejs";

/**
 * Per-designer gate (10 commands total across all projects). The project slug
 * is accepted but not used in the gating math — it's logged for traceability
 * via /api/gating/consume's RPC call, not here.
 */
export async function POST(request: NextRequest) {
  let body: { token?: string; toolName?: string; project?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { allowed: false, reason: "invalid_json" } satisfies GatingCheckResponse,
      { status: 400 },
    );
  }

  const token = body?.token?.trim();
  const toolName = body?.toolName?.trim();

  if (!isTokenShapeValid(token) || !toolName) {
    return Response.json(
      {
        allowed: false,
        reason: "invalid_token",
        message: "Invalid or missing dwic token — rerun `npx dwic setup`.",
      } satisfies GatingCheckResponse,
      { status: 200 },
    );
  }

  const account = await ensureAccount(token!);

  if (account.status === "cancelled") {
    return Response.json({
      allowed: false,
      reason: "subscription_cancelled",
      message:
        "Your profile is frozen. Resubscribe at https://designwithclaude.com/upgrade to resume.",
    } satisfies GatingCheckResponse);
  }

  if (account.status === "paid") {
    return Response.json({ allowed: true } satisfies GatingCheckResponse);
  }

  if (isFreeTierExhausted(account.commandCount)) {
    return Response.json({
      allowed: false,
      reason: "free_tier_exhausted",
      message: `You've used ${LIMITS.FREE_TIER_LIMIT}/${LIMITS.FREE_TIER_LIMIT} free commands. Upgrade at https://designwithclaude.com/upgrade`,
    } satisfies GatingCheckResponse);
  }

  return Response.json({
    allowed: true,
    remaining: freeTierRemaining(account.commandCount),
  } satisfies GatingCheckResponse);
}
