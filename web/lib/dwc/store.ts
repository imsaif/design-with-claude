// Supabase-backed store with in-memory fallback.
// Uses Supabase when DWC_SUPABASE_URL + DWC_SUPABASE_SERVICE_ROLE_KEY are set,
// otherwise falls back to an in-memory Map (fine for local dev + tests; broken
// on serverless, which is why Supabase exists).
import { hashToken } from "./tokens";
import { getSupabase, supabaseConfigured } from "./supabase";
import type {
  EventPayload,
  OnboardingAnswers,
  ProfileState,
  StoredEvent,
  SubscriptionStatus,
} from "./types";

const FREE_TIER_LIMIT = 10;
const MAX_EVENTS_PER_TOKEN = 500;

// ---------- In-memory fallback ----------
type MemStore = {
  profiles: Map<string, ProfileState>;
  events: Map<string, StoredEvent[]>;
};
const globalKey = Symbol.for("dwc.alpha.store");
const g = globalThis as unknown as Record<symbol, MemStore | undefined>;
function getMem(): MemStore {
  if (!g[globalKey]) g[globalKey] = { profiles: new Map(), events: new Map() };
  return g[globalKey]!;
}
function now(): string {
  return new Date().toISOString();
}
function randomId(): string {
  return (
    Math.random().toString(36).slice(2, 10) +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8)
  );
}

// ---------- Row → ProfileState / StoredEvent ----------
type ProfileRow = {
  token_hash: string;
  product_type: string | null;
  product_description: string | null;
  tech_stack: string[] | null;
  design_system: string | null;
  experience_level: string | null;
  tone_preference: string | null;
  claude_md: string | null;
  status: SubscriptionStatus;
  command_count: number;
  connected: boolean;
  created_at: string;
  last_seen_at: string;
};

function rowToProfile(row: ProfileRow): ProfileState {
  const onboarding: OnboardingAnswers | undefined =
    row.product_type &&
    row.product_description &&
    row.experience_level &&
    row.tone_preference
      ? {
          product_type: row.product_type,
          product_description: row.product_description,
          tech_stack: row.tech_stack ?? [],
          design_system: row.design_system ?? "",
          experience_level: row.experience_level as OnboardingAnswers["experience_level"],
          tone_preference: row.tone_preference as OnboardingAnswers["tone_preference"],
        }
      : undefined;
  return {
    tokenHash: row.token_hash,
    status: row.status,
    commandCount: row.command_count,
    connected: row.connected,
    createdAt: row.created_at,
    lastSeenAt: row.last_seen_at,
    onboarding,
    claudeMd: row.claude_md ?? undefined,
  };
}

type EventRow = {
  id: string;
  tool_name: string;
  input: unknown;
  output: unknown;
  event_timestamp: string;
  received_at: string;
};

function rowToEvent(row: EventRow): StoredEvent {
  return {
    id: row.id,
    token: "",
    toolName: row.tool_name,
    input: row.input,
    output: row.output,
    timestamp: row.event_timestamp,
    receivedAt: row.received_at,
  };
}

// ---------- Public API (async) ----------

export async function getOrCreateProfile(token: string): Promise<ProfileState> {
  const hash = hashToken(token);
  const sb = getSupabase();
  if (!sb) {
    const mem = getMem();
    const existing = mem.profiles.get(hash);
    if (existing) {
      existing.lastSeenAt = now();
      return existing;
    }
    const profile: ProfileState = {
      tokenHash: hash,
      status: "free",
      commandCount: 0,
      createdAt: now(),
      lastSeenAt: now(),
      connected: false,
    };
    mem.profiles.set(hash, profile);
    return profile;
  }

  // Upsert ensures a row exists; then fetch the full row back.
  const { error: upsertErr } = await sb
    .from("profiles")
    .upsert(
      { token_hash: hash, last_seen_at: new Date().toISOString() },
      { onConflict: "token_hash", ignoreDuplicates: false },
    );
  if (upsertErr) throw new Error(`profiles upsert failed: ${upsertErr.message}`);

  const { data, error } = await sb
    .from("profiles")
    .select("*")
    .eq("token_hash", hash)
    .single();
  if (error || !data) {
    throw new Error(`profiles select failed: ${error?.message ?? "no row"}`);
  }
  return rowToProfile(data as ProfileRow);
}

export async function getProfile(token: string): Promise<ProfileState | undefined> {
  const hash = hashToken(token);
  const sb = getSupabase();
  if (!sb) return getMem().profiles.get(hash);
  const { data, error } = await sb
    .from("profiles")
    .select("*")
    .eq("token_hash", hash)
    .maybeSingle();
  if (error) throw new Error(`profiles select failed: ${error.message}`);
  return data ? rowToProfile(data as ProfileRow) : undefined;
}

export async function incrementCommandCount(token: string): Promise<number> {
  const hash = hashToken(token);
  const sb = getSupabase();
  if (!sb) {
    const profile = await getOrCreateProfile(token);
    profile.commandCount += 1;
    profile.lastSeenAt = now();
    return profile.commandCount;
  }
  const { data, error } = await sb.rpc("increment_command_count", { p_token_hash: hash });
  if (error) throw new Error(`increment_command_count rpc failed: ${error.message}`);
  return typeof data === "number" ? data : Number(data) || 0;
}

export async function setSubscriptionStatus(
  token: string,
  status: SubscriptionStatus,
): Promise<void> {
  const hash = hashToken(token);
  const sb = getSupabase();
  if (!sb) {
    const profile = await getOrCreateProfile(token);
    profile.status = status;
    profile.lastSeenAt = now();
    return;
  }
  const { error } = await sb
    .from("profiles")
    .update({ status, last_seen_at: new Date().toISOString() })
    .eq("token_hash", hash);
  if (error) throw new Error(`profiles status update failed: ${error.message}`);
}

export async function setOnboarding(
  token: string,
  answers: OnboardingAnswers,
  claudeMd: string,
): Promise<ProfileState> {
  const hash = hashToken(token);
  const sb = getSupabase();
  if (!sb) {
    const profile = await getOrCreateProfile(token);
    profile.onboarding = answers;
    profile.claudeMd = claudeMd;
    profile.lastSeenAt = now();
    return profile;
  }
  const { error } = await sb.from("profiles").upsert(
    {
      token_hash: hash,
      product_type: answers.product_type,
      product_description: answers.product_description,
      tech_stack: answers.tech_stack,
      design_system: answers.design_system,
      experience_level: answers.experience_level,
      tone_preference: answers.tone_preference,
      claude_md: claudeMd,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "token_hash" },
  );
  if (error) throw new Error(`profiles upsert (onboarding) failed: ${error.message}`);

  const profile = await getProfile(token);
  if (!profile) throw new Error("profile vanished immediately after upsert");
  return profile;
}

export async function recordEvent(payload: EventPayload): Promise<StoredEvent> {
  const hash = hashToken(payload.token);
  const sb = getSupabase();
  if (!sb) {
    const mem = getMem();
    const list = mem.events.get(hash) ?? [];
    const stored: StoredEvent = { ...payload, id: randomId(), receivedAt: now() };
    list.push(stored);
    if (list.length > MAX_EVENTS_PER_TOKEN) {
      list.splice(0, list.length - MAX_EVENTS_PER_TOKEN);
    }
    mem.events.set(hash, list);
    if (payload.toolName === "__mcp.connected__") {
      const profile = await getOrCreateProfile(payload.token);
      profile.connected = true;
      profile.lastSeenAt = now();
    }
    return stored;
  }

  const { data, error } = await sb
    .from("companion_events")
    .insert({
      token_hash: hash,
      tool_name: payload.toolName,
      input: payload.input ?? {},
      output: payload.output ?? {},
      event_timestamp: payload.timestamp,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(`events insert failed: ${error?.message ?? "no row"}`);

  if (payload.toolName === "__mcp.connected__") {
    await sb
      .from("profiles")
      .upsert(
        {
          token_hash: hash,
          connected: true,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "token_hash" },
      );
  }

  return rowToEvent(data as EventRow);
}

export async function getRecentEvents(token: string, limit = 50): Promise<StoredEvent[]> {
  const hash = hashToken(token);
  const sb = getSupabase();
  if (!sb) {
    const list = getMem().events.get(hash) ?? [];
    const sliceFrom = Math.max(0, list.length - limit);
    return list.slice(sliceFrom);
  }
  const capped = Math.min(200, Math.max(1, limit));
  const { data, error } = await sb
    .from("companion_events")
    .select("*")
    .eq("token_hash", hash)
    .order("received_at", { ascending: false })
    .limit(capped);
  if (error) throw new Error(`events select failed: ${error.message}`);
  // Return chronological (oldest → newest) so the companion highlights the latest event naturally.
  return ((data ?? []) as EventRow[]).map(rowToEvent).reverse();
}

export function freeTierRemaining(count: number): number {
  return Math.max(0, FREE_TIER_LIMIT - count);
}

export function isFreeTierExhausted(count: number): boolean {
  return count >= FREE_TIER_LIMIT;
}

export const LIMITS = {
  FREE_TIER_LIMIT,
  MAX_EVENTS_PER_TOKEN,
} as const;

export { supabaseConfigured };
