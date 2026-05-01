import { createHash, randomBytes } from "node:crypto";

const TOKEN_PATTERN = /^imr_[A-Za-z0-9_-]{8,}$/;
const ANONYMOUS_TOKEN_PATTERN = /^anon_[A-Za-z0-9_-]{6,}$/;

export function isTokenShapeValid(token: string | undefined | null): boolean {
  if (!token) return false;
  return TOKEN_PATTERN.test(token);
}

export function isAnonymousTokenShapeValid(token: string | undefined | null): boolean {
  if (!token) return false;
  return ANONYMOUS_TOKEN_PATTERN.test(token);
}

// Anonymous tools may post to /api/events without a minted user token. Each
// entry must be a synthetic name (double-underscore prefix) so it can never
// collide with a real MCP tool. Keep this list tight.
export const ANONYMOUS_TOOL_ALLOWLIST: ReadonlySet<string> = new Set([
  "__cli.audit.summary__",
]);

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function mintToken(): string {
  // 9 random bytes → 12 chars in base64url → `imr_` + 12 = 16 total
  const rand = randomBytes(9).toString("base64url");
  return `imr_${rand}`;
}
