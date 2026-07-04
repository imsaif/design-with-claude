import { NextRequest, NextResponse } from "next/server";
import { parseAllowlist, ipMatches, extractClientIp } from "./lib/ip-allowlist";

// Edge gate for the admin surface. Blocks any request to /admin or /api/admin
// whose client IP is not on ADMIN_IP_ALLOWLIST — BEFORE the request reaches the
// password auth. This is an outer layer, not a replacement: the existing
// HMAC-session + password auth (lib/admin-auth.ts) still runs behind it, so
// access requires an allowed IP AND the password.
//
// Fail-closed: if the allowlist is unset/empty the admin is blocked entirely,
// so a forgotten env var can never silently leave the panel open.
//
// Break-glass: set ADMIN_IP_BYPASS=1 to disable the IP gate temporarily (falls
// back to password-only) when a changed IP has locked the operator out.
//
// Blocked requests get a 404 (not 403) so the endpoint's existence isn't
// confirmed to anyone off the allowlist.

export const config = {
  // Match ONLY the admin surface. The public site, /api/health (Supabase
  // keep-alive cron) and /api/get-started/* (public email mint) are untouched.
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

function notFound(): NextResponse {
  // Mimic a plain Next 404 for HTML routes; JSON for API routes is fine too,
  // but a bare 404 body keeps the endpoint opaque.
  return new NextResponse("Not Found", { status: 404 });
}

export function middleware(request: NextRequest): NextResponse {
  // Break-glass: revert to password-only auth behind this gate.
  if (process.env.ADMIN_IP_BYPASS === "1") {
    console.warn("[admin-gate] ADMIN_IP_BYPASS is ON — IP allowlist disabled, password-only. Turn this off once recovered.");
    return NextResponse.next();
  }

  const entries = parseAllowlist(process.env.ADMIN_IP_ALLOWLIST);
  if (entries.length === 0) {
    // Fail-closed: no allowlist configured => no admin access.
    console.warn("[admin-gate] ADMIN_IP_ALLOWLIST is unset/empty — blocking all admin access (fail-closed). Set it in Vercel to allow your IP.");
    return notFound();
  }

  // On Vercel, x-forwarded-for is set at the edge and cannot be spoofed by the
  // client, so it's the trusted source for the real client IP.
  const clientIp = extractClientIp(request.headers.get("x-forwarded-for"));

  if (!clientIp || !ipMatches(clientIp, entries)) {
    return notFound();
  }

  return NextResponse.next();
}
