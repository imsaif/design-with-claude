# Admin IP allowlist — design

**Date:** 2026-07-04
**Status:** approved, pre-implementation

## Goal

Make dwic's live `/admin` panel (a password-gated viewer over Supabase user-email PII) impossible to brute-force from the public internet, by gating it behind an IP allowlist at the edge — *in front of* the existing password auth. Leave the repo public; add no new infrastructure.

## Threat being closed

The live `/admin` + `/api/admin/*` endpoints are reachable by anyone on the internet and protected only by a single shared password with **no rate-limiting or lockout** on the login route. An attacker can POST password guesses indefinitely. (No live secret is in git history — only the now-rotated admin password ever leaked — so this is about the live attack surface, not history.)

## Mechanism

A new Next.js edge middleware (`web/middleware.ts`) that runs before matched routes and blocks any request whose client IP is not on an allowlist.

- **Matches only:** `/admin/:path*` and `/api/admin/:path*`.
- **Explicitly does NOT match:** the public site, `/api/health` (Supabase keep-alive cron), `/api/get-started/*` (public email mint), or any other API. Enforced via the middleware `config.matcher`.
- **Blocked response:** HTTP **404** (not 403). A 403 confirms `/admin` exists; 404 makes the endpoint invisible to anyone not on an allowed IP.
- **Layered, not a replacement:** the existing HMAC-session + password auth (`web/lib/admin-auth.ts`) stays untouched behind the gate. Access requires **allowed IP AND password**.

### Client IP source & trust

The client IP is read from the `x-forwarded-for` header, first hop. This is trustworthy **only** because Vercel overwrites `x-forwarded-for` at its edge, so it cannot be spoofed by the client on a Vercel deployment. This assumption is documented inline in the middleware. If the header is absent (e.g. local dev without a proxy), treat as not-allowed under fail-closed (see below), except when the bypass flag is set.

### Allowlist configuration

- Env var `ADMIN_IP_ALLOWLIST` — comma-separated list of entries; each entry is either an exact IP (IPv4 or IPv6) or a CIDR range (e.g. `203.0.113.4`, `2001:db8::1`, `203.0.113.0/24`).
- Whitespace around entries is trimmed; empty entries ignored.
- Multiple IPs supported so the operator can list home + mobile-hotspot + office up front and rarely edit it.

### Fail-closed

If `ADMIN_IP_ALLOWLIST` is unset or empty, the middleware blocks `/admin` entirely (404). Falling back to password-only would be a silent no-op where the hardening looks active but isn't. "No allowlist = no admin."

### Break-glass recovery

Env var `ADMIN_IP_BYPASS` — when set to `"1"`, the middleware passes all requests through to the existing password auth (IP gate disabled). This is the escape hatch for "my IP changed while traveling and I'm locked out": flip it on in Vercel (~1 min redeploy), get in, add the new IP to `ADMIN_IP_ALLOWLIST`, flip it back off. Because bypass reverts to today's password-only behavior, it is safe as a temporary state, not a permanent one. The middleware logs a warning on every request while bypass is active so it isn't left on unnoticed.

## Files

- `web/middleware.ts` — new. The edge middleware + `config.matcher`.
- `web/lib/ip-allowlist.ts` — new. Pure helpers: `parseAllowlist(env: string | undefined): Entry[]`, `ipMatches(ip: string, entries: Entry[]): boolean`, `extractClientIp(headerValue: string | null): string | null`. Kept separate from the middleware so the matching logic is unit-testable without a request or the Next runtime.
- `web/lib/ip-allowlist.test.ts` — new. Node assertion-based unit tests (no framework; `web/` has no test runner). Run with `npx tsx web/lib/ip-allowlist.test.ts`. Exits non-zero on failure.
- `web/ADMIN_SECURITY.md` — new. Short ops note: what the gate does, how to find your IP (`curl -s https://api.ipify.org`), how to set `ADMIN_IP_ALLOWLIST` in Vercel, the fail-closed behavior, and the break-glass procedure.

## Behavior matrix

| Condition | Result |
|---|---|
| IP in allowlist, valid session/password | Admin loads (unchanged behind the gate) |
| IP in allowlist, no/expired session | Existing password login screen (unchanged) |
| IP not in allowlist | 404, request never reaches admin code |
| `ADMIN_IP_ALLOWLIST` unset/empty, no bypass | 404 (fail-closed) |
| `ADMIN_IP_BYPASS=1` | Gate disabled; falls through to password auth; warning logged |
| Request to `/api/health`, public site, mint | Untouched (not matched) |

## Rollout sequence (lockout-safe)

1. Operator finds current public IP(s) (`curl -s https://api.ipify.org`; repeat on each network).
2. Operator sets `ADMIN_IP_ALLOWLIST` in Vercel **Production** env to those IP(s).
3. Verify the value is live (a build/env check).
4. **Then** merge/deploy the middleware. Protection is active immediately and the operator is already allowlisted.

Deploying the middleware *before* step 2 would 404 the operator's own admin (fail-closed) — hence the ordering.

## Testing

- Unit tests for `ip-allowlist.ts`:
  - exact IPv4 match / non-match
  - exact IPv6 match / non-match
  - CIDR v4 in-range / out-of-range / boundary
  - malformed allowlist entries ignored, not crashing
  - empty/unset allowlist → no match (drives fail-closed)
  - `extractClientIp` picks the first hop from a multi-value `x-forwarded-for`, handles null
- Middleware behavior verified manually against the deployed Preview (allowed IP passes, other blocked) since edge middleware isn't covered by the existing node test harness.

## Out of scope

- No repo split / making the repo private (separate decision; declined).
- No git-history rewrite (no live secret leaked; low value).
- No 2FA / rate-limiting store (IP allowlist chosen instead).
- No change to the admin password mechanism itself, beyond leaving it in place as the second layer.
- Fixing the admin panel's own accessibility findings (unlabeled inputs) — noted separately; internal-only, low priority.
