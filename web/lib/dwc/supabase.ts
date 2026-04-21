import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;
let warned = false;

export function getSupabase(): SupabaseClient | null {
  if (client) return client;
  const url = process.env.DWC_SUPABASE_URL?.trim();
  const key = process.env.DWC_SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    if (!warned) {
      console.warn(
        "[dwc] Supabase env not configured — falling back to in-memory store. " +
          "Set DWC_SUPABASE_URL and DWC_SUPABASE_SERVICE_ROLE_KEY for persistence.",
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
    process.env.DWC_SUPABASE_URL?.trim() && process.env.DWC_SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}
