import { NextRequest } from "next/server";
import { mintToken } from "@/lib/dwic/tokens";
import { ensureAccount } from "@/lib/dwic/store";
import { sendInstallEmail, isEmailConfigured } from "@/lib/dwic/email";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX = 254;

function isValidEmail(input: unknown): input is string {
  if (typeof input !== "string") return false;
  const trimmed = input.trim();
  if (trimmed.length === 0 || trimmed.length > EMAIL_MAX) return false;
  return EMAIL_RE.test(trimmed);
}

/**
 * POST /api/get-started/mint
 *
 * Body: { email: string, website_url?: string }
 *
 * - Validates email shape (RFC-light: presence of `@`, a `.` after the `@`,
 *   no whitespace, length cap 254).
 * - `website_url` is a honeypot; if non-empty we return a fake-shaped token
 *   without persisting anything. Stops naive scrapers without telegraphing
 *   the bot detection.
 * - On real submissions: mints a token, calls `ensureAccount(token, email)`
 *   so the email lands in `profiles.email`, and returns the token.
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, reason: "invalid_json" }, { status: 400 });
  }

  // Honeypot — bots fill this; real users never see it. Return success-shaped
  // payload so the bot doesn't notice the rejection, but never persist.
  const honeypot = typeof body.website_url === "string" ? body.website_url.trim() : "";
  if (honeypot.length > 0) {
    return Response.json({ ok: true, token: mintToken() });
  }

  const rawEmail = typeof body.email === "string" ? body.email.trim() : "";
  if (!isValidEmail(rawEmail)) {
    return Response.json(
      { ok: false, reason: "invalid_email" },
      { status: 400 },
    );
  }

  const token = mintToken();
  try {
    await ensureAccount(token, rawEmail);
  } catch (err) {
    return Response.json(
      { ok: false, reason: "persist_failed", detail: (err as Error).message },
      { status: 500 },
    );
  }

  // Fire-and-forget email send. The user already has the install command on
  // screen via the redirect — email is a recovery / convenience layer. Never
  // block the response; never surface errors to the user.
  if (isEmailConfigured()) {
    const origin =
      request.headers.get("origin") ??
      `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    void sendInstallEmail({
      to: rawEmail,
      token,
      project: "default",
      origin,
    }).catch(() => {
      // swallow — telemetry/logging is fine here, but we don't surface.
    });
  }

  return Response.json({ ok: true, token, emailQueued: isEmailConfigured() });
}
