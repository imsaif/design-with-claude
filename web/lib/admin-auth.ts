import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual, createHmac } from "crypto";

const SESSION_DURATION = 24 * 60 * 60 * 1000;
const COOKIE_NAME = "dwic_admin_session";

function getSecretKey(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "dwic-fallback-secret-change-me"
  );
}

function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    timingSafeEqual(Buffer.from(a), Buffer.from(a));
    return false;
  }
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function verifyAdminPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    console.error("ADMIN_PASSWORD environment variable is not set");
    return false;
  }
  if (adminPassword.length < 8) {
    console.error("ADMIN_PASSWORD is too short (minimum 8 characters)");
    return false;
  }
  return secureCompare(password, adminPassword);
}

export function createSession(): string {
  const expiresAt = Date.now() + SESSION_DURATION;
  const data = `admin:${expiresAt}`;
  const signature = createHmac("sha256", getSecretKey()).update(data).digest("hex");
  return `${expiresAt}.${signature}`;
}

export function validateSession(token: string): boolean {
  if (!token || !token.includes(".")) return false;
  const [expiresAtStr, signature] = token.split(".");
  const expiresAt = parseInt(expiresAtStr, 10);
  if (isNaN(expiresAt) || Date.now() > expiresAt) return false;
  const data = `admin:${expiresAt}`;
  const expected = createHmac("sha256", getSecretKey()).update(data).digest("hex");
  return secureCompare(signature, expected);
}

export async function isAdminAuthenticated(request: NextRequest): Promise<boolean> {
  const sessionId = request.cookies.get(COOKIE_NAME)?.value;
  return Boolean(sessionId && validateSession(sessionId));
}

export function getSessionCookie(sessionId: string) {
  return {
    name: COOKIE_NAME,
    value: sessionId,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: SESSION_DURATION / 1000,
      path: "/",
    },
  };
}

export async function checkAdminAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(COOKIE_NAME)?.value;
  return Boolean(sessionId && validateSession(sessionId));
}

export function withAdminAuth<T>(
  handler: (request: NextRequest) => Promise<NextResponse<T>>,
): (request: NextRequest) => Promise<NextResponse<T | { error: string }>> {
  return async (request: NextRequest) => {
    if (!(await isAdminAuthenticated(request))) {
      return NextResponse.json(
        { error: "Unauthorized. Admin authentication required." },
        { status: 401 },
      );
    }
    return handler(request);
  };
}
