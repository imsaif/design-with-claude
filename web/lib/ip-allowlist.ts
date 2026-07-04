// Pure IP-allowlist matching for the admin edge gate. No Next / request
// dependencies so it can be unit-tested in isolation (see ip-allowlist.test.ts).
//
// Supports exact IPv4 / IPv6 entries and CIDR ranges (v4 and v6). Anything that
// doesn't parse is ignored rather than throwing — a malformed allowlist entry
// must never crash the middleware (which would fail every admin request).

export type Entry =
  | { kind: "exact"; bytes: number[] }
  | { kind: "cidr"; bytes: number[]; prefix: number };

/** Parse an IPv4 or IPv6 string into its byte array (4 or 16 bytes). Returns
 * null for anything that isn't a well-formed address. */
export function ipToBytes(ip: string): number[] | null {
  const s = ip.trim();
  if (s.length === 0) return null;
  if (s.includes(":")) return ipv6ToBytes(s);
  return ipv4ToBytes(s);
}

function ipv4ToBytes(s: string): number[] | null {
  const parts = s.split(".");
  if (parts.length !== 4) return null;
  const bytes: number[] = [];
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null;
    const n = Number(p);
    if (n > 255) return null;
    bytes.push(n);
  }
  return bytes;
}

function ipv6ToBytes(s: string): number[] | null {
  // Reject an embedded zone id (e.g. fe80::1%eth0) — not meaningful for a public allowlist.
  if (s.includes("%")) return null;
  const halves = s.split("::");
  if (halves.length > 2) return null;

  const parseGroups = (g: string): number[] | null => {
    if (g === "") return [];
    const out: number[] = [];
    for (const part of g.split(":")) {
      if (!/^[0-9a-fA-F]{1,4}$/.test(part)) return null;
      const v = parseInt(part, 16);
      out.push((v >> 8) & 0xff, v & 0xff);
    }
    return out;
  };

  let head: number[] | null;
  let tail: number[] | null;
  if (halves.length === 2) {
    head = parseGroups(halves[0]);
    tail = parseGroups(halves[1]);
    if (head === null || tail === null) return null;
    const fill = 16 - head.length - tail.length;
    if (fill < 0) return null;
    return [...head, ...new Array(fill).fill(0), ...tail];
  }
  const only = parseGroups(s);
  if (only === null || only.length !== 16) return null;
  return only;
}

/** Parse a single allowlist entry ("1.2.3.4" or "1.2.3.0/24"). Null if invalid. */
function parseEntry(raw: string): Entry | null {
  const s = raw.trim();
  if (s.length === 0) return null;
  const slash = s.indexOf("/");
  if (slash === -1) {
    const bytes = ipToBytes(s);
    return bytes ? { kind: "exact", bytes } : null;
  }
  const bytes = ipToBytes(s.slice(0, slash));
  const prefixStr = s.slice(slash + 1);
  if (!bytes || !/^\d{1,3}$/.test(prefixStr)) return null;
  const prefix = Number(prefixStr);
  if (prefix > bytes.length * 8) return null;
  return { kind: "cidr", bytes, prefix };
}

/** Parse the ADMIN_IP_ALLOWLIST env value into entries. Empty/undefined → []. */
export function parseAllowlist(env: string | undefined): Entry[] {
  if (!env) return [];
  return env
    .split(",")
    .map(parseEntry)
    .filter((e): e is Entry => e !== null);
}

function sameFamily(a: number[], b: number[]): boolean {
  return a.length === b.length;
}

function cidrMatch(ip: number[], net: number[], prefix: number): boolean {
  if (!sameFamily(ip, net)) return false;
  let bitsLeft = prefix;
  for (let i = 0; i < net.length && bitsLeft > 0; i++) {
    const take = Math.min(8, bitsLeft);
    const mask = take === 8 ? 0xff : (0xff << (8 - take)) & 0xff;
    if ((ip[i] & mask) !== (net[i] & mask)) return false;
    bitsLeft -= take;
  }
  return true;
}

/** True if `ip` matches any allowlist entry. Empty entries → false (fail-closed). */
export function ipMatches(ip: string, entries: Entry[]): boolean {
  const bytes = ipToBytes(ip);
  if (!bytes || entries.length === 0) return false;
  for (const e of entries) {
    if (e.kind === "exact") {
      if (sameFamily(bytes, e.bytes) && bytes.every((b, i) => b === e.bytes[i])) return true;
    } else if (cidrMatch(bytes, e.bytes, e.prefix)) {
      return true;
    }
  }
  return false;
}

/** Extract the client IP from an `x-forwarded-for` header value (first hop).
 * On Vercel this header is set by the edge and cannot be spoofed by the client. */
export function extractClientIp(headerValue: string | null): string | null {
  if (!headerValue) return null;
  const first = headerValue.split(",")[0]?.trim();
  return first && first.length > 0 ? first : null;
}
