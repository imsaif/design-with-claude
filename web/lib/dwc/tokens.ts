import { createHash, randomBytes } from "node:crypto";

const TOKEN_PATTERN = /^imr_[A-Za-z0-9_-]{8,}$/;

export function isTokenShapeValid(token: string | undefined | null): boolean {
  if (!token) return false;
  return TOKEN_PATTERN.test(token);
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function mintToken(): string {
  // 9 random bytes → 12 chars in base64url → `imr_` + 12 = 16 total
  const rand = randomBytes(9).toString("base64url");
  return `imr_${rand}`;
}
