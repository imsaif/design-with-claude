import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;
let warned = false;

export function getSupabase(): SupabaseClient | null {
  if (client) return client;
  const url = process.env.DWIC_SUPABASE_URL?.trim();
  const key = process.env.DWIC_SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    if (!warned) {
      console.warn(
        "[dwic] Supabase env not configured — falling back to in-memory store. " +
          "Set DWIC_SUPABASE_URL and DWIC_SUPABASE_SERVICE_ROLE_KEY for persistence.",
      );
      warned = true;
    }
    return null;
  }
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: "public" },
  });
  return client;
}

export function supabaseConfigured(): boolean {
  return Boolean(
    process.env.DWIC_SUPABASE_URL?.trim() && process.env.DWIC_SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}

/**
 * Format a Supabase request failure into a UI-friendly error message.
 * Handles the common case where DWIC_SUPABASE_URL points at a host that
 * doesn't resolve (deleted/paused project, typo) — surfaces the host so the
 * admin can act on it instead of staring at "TypeError: fetch failed".
 */
export function formatSupabaseError(err: unknown): string {
  let host = "Supabase";
  try {
    const url = process.env.DWIC_SUPABASE_URL?.trim();
    if (url) host = new URL(url).host;
  } catch {
    /* ignore */
  }

  const message = err instanceof Error ? err.message : String(err ?? "unknown error");
  // node 20+ wraps DNS / connect errors under `cause`
  let causeCode: string | undefined;
  if (err && typeof err === "object" && "cause" in err) {
    const cause = (err as { cause?: { code?: string } }).cause;
    causeCode = cause?.code;
  }

  if (causeCode === "ENOTFOUND" || /fetch failed/i.test(message)) {
    return `Could not reach ${host}. The host did not resolve — check DWIC_SUPABASE_URL is correct and the project is active.`;
  }
  if (causeCode === "ECONNREFUSED" || causeCode === "ECONNRESET") {
    return `Could not connect to ${host} (${causeCode}). The Supabase project may be paused or restarting.`;
  }
  if (causeCode === "ETIMEDOUT") {
    return `Connection to ${host} timed out. Network issue or Supabase outage.`;
  }
  return `Supabase request failed: ${message}`;
}
