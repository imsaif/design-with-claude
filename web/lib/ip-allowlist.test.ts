// Unit tests for the admin IP-allowlist matcher. No framework (web/ has no test
// runner) — run with: npx tsx web/lib/ip-allowlist.test.ts
// Exits non-zero on any failure.

import { parseAllowlist, ipMatches, extractClientIp } from "./ip-allowlist.js";

let failed = 0;
function ok(cond: boolean, msg: string) {
  if (cond) process.stdout.write(`  ✔ ${msg}\n`);
  else { failed++; process.stderr.write(`  ✘ ${msg}\n`); }
}

// --- exact IPv4 ---
{
  const list = parseAllowlist("203.0.113.4, 198.51.100.7");
  ok(ipMatches("203.0.113.4", list), "exact IPv4 in list matches");
  ok(ipMatches("198.51.100.7", list), "second exact IPv4 matches");
  ok(!ipMatches("203.0.113.5", list), "off-by-one IPv4 does not match");
  ok(!ipMatches("10.0.0.1", list), "unrelated IPv4 does not match");
}

// --- exact IPv6 ---
{
  const list = parseAllowlist("2001:db8::1");
  ok(ipMatches("2001:db8::1", list), "exact IPv6 matches");
  ok(ipMatches("2001:0db8:0000:0000:0000:0000:0000:0001", list), "expanded IPv6 form matches compressed entry");
  ok(!ipMatches("2001:db8::2", list), "different IPv6 does not match");
  ok(!ipMatches("203.0.113.4", list), "IPv4 does not match an IPv6-only list");
}

// --- CIDR v4 ---
{
  const list = parseAllowlist("203.0.113.0/24");
  ok(ipMatches("203.0.113.0", list), "CIDR v4 network address matches");
  ok(ipMatches("203.0.113.255", list), "CIDR v4 broadcast-ish address matches");
  ok(ipMatches("203.0.113.42", list), "CIDR v4 mid-range matches");
  ok(!ipMatches("203.0.114.1", list), "CIDR v4 out-of-range does not match");
}

// --- CIDR v4 non-byte-aligned prefix ---
{
  const list = parseAllowlist("192.168.1.0/28"); // .0-.15
  ok(ipMatches("192.168.1.15", list), "/28 upper boundary in range");
  ok(!ipMatches("192.168.1.16", list), "/28 just past boundary out of range");
}

// --- CIDR v6 ---
{
  const list = parseAllowlist("2001:db8::/32");
  ok(ipMatches("2001:db8:1234::abcd", list), "CIDR v6 in range matches");
  ok(!ipMatches("2001:db9::1", list), "CIDR v6 out of range does not match");
}

// --- malformed entries ignored, not crashing ---
{
  const list = parseAllowlist("not-an-ip, 999.999.999.999, 203.0.113.4, , 1.2.3.4/99");
  ok(ipMatches("203.0.113.4", list), "valid entry still matches when siblings are malformed");
  ok(!ipMatches("1.2.3.4", list), "entry with invalid prefix /99 is dropped");
  ok(list.length === 1, `only the one valid entry survives parsing (got ${list.length})`);
}

// --- empty / undefined allowlist → fail-closed (no match) ---
{
  ok(!ipMatches("203.0.113.4", parseAllowlist("")), "empty allowlist matches nothing");
  ok(!ipMatches("203.0.113.4", parseAllowlist(undefined)), "undefined allowlist matches nothing");
  ok(!ipMatches("203.0.113.4", parseAllowlist("   ")), "whitespace-only allowlist matches nothing");
}

// --- extractClientIp ---
{
  ok(extractClientIp("203.0.113.4") === "203.0.113.4", "single-value XFF returns the IP");
  ok(extractClientIp("203.0.113.4, 70.1.2.3, 10.0.0.1") === "203.0.113.4", "multi-hop XFF returns first hop (real client)");
  ok(extractClientIp("  203.0.113.4  ") === "203.0.113.4", "XFF value is trimmed");
  ok(extractClientIp(null) === null, "null XFF returns null");
  ok(extractClientIp("") === null, "empty XFF returns null");
}

if (failed > 0) {
  process.stderr.write(`\n${failed} check(s) failed.\n`);
  process.exit(1);
}
process.stdout.write("\nALL GOOD — ip-allowlist matcher verified.\n");
