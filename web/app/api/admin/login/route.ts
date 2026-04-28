import { NextRequest, NextResponse } from "next/server";
import { verifyAdminPassword, createSession, getSessionCookie } from "@/lib/admin-auth";

export const runtime = "nodejs";

const failedAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const record = failedAttempts.get(ip);
  if (!record) return false;
  if (Date.now() - record.lastAttempt > LOCKOUT_DURATION) {
    failedAttempts.delete(ip);
    return false;
  }
  return record.count >= MAX_ATTEMPTS;
}

function recordFailedAttempt(ip: string): void {
  const record = failedAttempts.get(ip) || { count: 0, lastAttempt: 0 };
  record.count += 1;
  record.lastAttempt = Date.now();
  failedAttempts.set(ip, record);
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many failed attempts. Please try again in 15 minutes." },
      { status: 429 },
    );
  }

  try {
    const body = await request.json();
    const { password } = body;
    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }
    if (!verifyAdminPassword(password)) {
      recordFailedAttempt(ip);
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }
    failedAttempts.delete(ip);
    const sessionId = createSession();
    const cookie = getSessionCookie(sessionId);
    const response = NextResponse.json({ success: true });
    response.cookies.set(
      cookie.name,
      cookie.value,
      cookie.options as Parameters<typeof response.cookies.set>[2],
    );
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
