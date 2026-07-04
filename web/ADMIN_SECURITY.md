# Admin security — IP allowlist gate

The `/admin` panel is a viewer over Supabase user-email PII. It's protected by
two layers:

1. **IP allowlist** (edge middleware, `web/middleware.ts`) — only requests from
   allowlisted IPs reach `/admin` or `/api/admin/*` at all. Everyone else gets a
   plain `404` (the endpoint is invisible to them).
2. **Password + HMAC session** (`web/lib/admin-auth.ts`) — unchanged, runs
   behind the IP gate. So access requires **an allowed IP AND the password**.

Public routes (the marketing site, `/api/health` keep-alive cron, the
`/api/get-started` email mint) are **not** affected — the middleware only
matches `/admin/:path*` and `/api/admin/:path*`.

## Configure it (Vercel → Project → Settings → Environment Variables, Production)

1. Find your current public IP on each network you'll admin from:
   ```
   curl -s https://api.ipify.org        # IPv4
   curl -s https://api64.ipify.org      # IPv6, if your network uses it
   ```
2. Set **`ADMIN_IP_ALLOWLIST`** to a comma-separated list. Entries can be exact
   IPs or CIDR ranges, IPv4 or IPv6:
   ```
   203.0.113.4, 198.51.100.7, 2001:db8::1, 203.0.113.0/24
   ```
   List home + mobile hotspot + office up front so you rarely edit it.
3. Redeploy (Vercel does this automatically on env change, or trigger it).

**Fail-closed:** if `ADMIN_IP_ALLOWLIST` is unset or empty, **all** admin access
is blocked (404). Set it before (or at the same time as) deploying the
middleware, or you'll lock yourself out.

## Locked yourself out? (IP changed while travelling)

Break-glass with **`ADMIN_IP_BYPASS`**:

1. In Vercel, set `ADMIN_IP_BYPASS=1` (Production) and redeploy (~1 min). The IP
   gate turns off and the panel falls back to **password-only** — so it's only
   as safe as your password while this is on. A warning is logged on every admin
   request while bypass is active.
2. Log in, add your new IP to `ADMIN_IP_ALLOWLIST`.
3. **Remove `ADMIN_IP_BYPASS`** (or set it to anything other than `1`) and
   redeploy. Don't leave it on.

## Tests

`npx tsx web/lib/ip-allowlist.test.ts` — covers exact v4/v6, CIDR ranges,
malformed-entry resilience, and fail-closed-on-empty for the matcher.
