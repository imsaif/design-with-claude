// Supabase-backed store with in-memory fallback.
// Multi-project (alpha.2): every read/write is scoped by (token_hash, project_id).
// Onboarding + per-project counters live in `project_profiles`; subscription status
// and the canonical per-designer free-tier counter live in `profiles`.
import { hashToken } from "./tokens";
import { getSupabase, supabaseConfigured } from "./supabase";
import { resolveProject, type ResolvedProject } from "./projects";
import {
  DEFAULT_PROJECT_SLUG,
  type AccountState,
  type EventPayload,
  type OnboardingAnswers,
  type ProfileState,
  type ProjectRef,
  type StoredEvent,
  type SubscriptionStatus,
} from "./types";

const FREE_TIER_LIMIT = 10;
const MAX_EVENTS_PER_TOKEN = 500;

// ---------- In-memory fallback ----------

type MemAccount = {
  tokenHash: string;
  status: SubscriptionStatus;
  commandCount: number;
  createdAt: string;
  lastSeenAt: string;
};

type MemProjectProfile = {
  projectId: string;
  onboarding?: OnboardingAnswers;
  claudeMd?: string;
  commandCount: number;
  connected: boolean;
  createdAt: string;
  lastSeenAt: string;
};

type MemStore = {
  accounts: Map<string, MemAccount>; // keyed by tokenHash
  projectProfiles: Map<string, MemProjectProfile>; // keyed by projectId
  events: Map<string, StoredEvent[]>; // keyed by projectId
};

const globalKey = Symbol.for("dwc.alpha.store.v2");
const g = globalThis as unknown as Record<symbol, MemStore | undefined>;
function getMem(): MemStore {
  if (!g[globalKey]) {
    g[globalKey] = {
      accounts: new Map(),
      projectProfiles: new Map(),
      events: new Map(),
    };
  }
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

function getOrInitMemAccount(tokenHash: string): MemAccount {
  const mem = getMem();
  const existing = mem.accounts.get(tokenHash);
  if (existing) {
    existing.lastSeenAt = now();
    return existing;
  }
  const fresh: MemAccount = {
    tokenHash,
    status: "free",
    commandCount: 0,
    createdAt: now(),
    lastSeenAt: now(),
  };
  mem.accounts.set(tokenHash, fresh);
  return fresh;
}

function getOrInitMemProjectProfile(projectId: string): MemProjectProfile {
  const mem = getMem();
  const existing = mem.projectProfiles.get(projectId);
  if (existing) {
    existing.lastSeenAt = now();
    return existing;
  }
  const fresh: MemProjectProfile = {
    projectId,
    commandCount: 0,
    connected: false,
    createdAt: now(),
    lastSeenAt: now(),
  };
  mem.projectProfiles.set(projectId, fresh);
  return fresh;
}

// ---------- Row shapes ----------

type AccountRow = {
  token_hash: string;
  status: SubscriptionStatus;
  command_count: number;
  created_at: string;
  last_seen_at: string;
};

type ProjectProfileRow = {
  project_id: string;
  product_type: string | null;
  product_description: string | null;
  tech_stack: string[] | null;
  design_system: string | null;
  experience_level: string | null;
  tone_preference: string | null;
  claude_md: string | null;
  command_count: number;
  connected: boolean;
  created_at: string;
  last_seen_at: string;
  projects?: {
    slug: string;
    display_name: string | null;
  };
};

type EventRow = {
  id: string;
  tool_name: string;
  input: unknown;
  output: unknown;
  event_timestamp: string;
  received_at: string;
};

function pickOnboarding(row: ProjectProfileRow): OnboardingAnswers | undefined {
  if (
    row.product_type &&
    row.product_description &&
    row.experience_level &&
    row.tone_preference
  ) {
    return {
      product_type: row.product_type,
      product_description: row.product_description,
      tech_stack: row.tech_stack ?? [],
      design_system: row.design_system ?? "",
      experience_level: row.experience_level as OnboardingAnswers["experience_level"],
      tone_preference: row.tone_preference as OnboardingAnswers["tone_preference"],
    };
  }
  return undefined;
}

function buildProfileState(args: {
  tokenHash: string;
  account: { status: SubscriptionStatus; commandCount: number; createdAt: string; lastSeenAt: string };
  projectRow: ProjectProfileRow;
  slug: string;
  displayName: string | null;
}): ProfileState {
  return {
    tokenHash: args.tokenHash,
    status: args.account.status,
    commandCount: args.account.commandCount,
    createdAt: args.projectRow.created_at,
    lastSeenAt: args.projectRow.last_seen_at,
    connected: args.projectRow.connected,
    onboarding: pickOnboarding(args.projectRow),
    claudeMd: args.projectRow.claude_md ?? undefined,
    project: args.slug,
    projectId: args.projectRow.project_id,
    projectDisplayName: args.displayName ?? undefined,
  };
}

// ---------- Public API ----------

/** Ensure an account row exists and return it. Account = per-token. */
export async function ensureAccount(token: string): Promise<{
  tokenHash: string;
  status: SubscriptionStatus;
  commandCount: number;
  createdAt: string;
  lastSeenAt: string;
}> {
  const hash = hashToken(token);
  const sb = getSupabase();
  if (!sb) {
    const m = getOrInitMemAccount(hash);
    return { tokenHash: hash, status: m.status, commandCount: m.commandCount, createdAt: m.createdAt, lastSeenAt: m.lastSeenAt };
  }

  const { error: upsertErr } = await sb
    .from("profiles")
    .upsert(
      { token_hash: hash, last_seen_at: new Date().toISOString() },
      { onConflict: "token_hash", ignoreDuplicates: false },
    );
  if (upsertErr) throw new Error(`profiles upsert failed: ${upsertErr.message}`);

  const { data, error } = await sb
    .from("profiles")
    .select("token_hash, status, command_count, created_at, last_seen_at")
    .eq("token_hash", hash)
    .single();
  if (error || !data) throw new Error(`profiles select failed: ${error?.message ?? "no row"}`);
  const row = data as AccountRow;
  return {
    tokenHash: row.token_hash,
    status: row.status,
    commandCount: row.command_count,
    createdAt: row.created_at,
    lastSeenAt: row.last_seen_at,
  };
}

/** Per-(token, project) profile read/write. */
export async function getOrCreateProfile(
  token: string,
  project: string | undefined,
): Promise<ProfileState> {
  const account = await ensureAccount(token);
  const resolved = await resolveProject({ token, slug: project, autoCreate: true });
  if (!resolved.projectId) {
    throw new Error(`Could not resolve project (slug=${project ?? "∅"}, reason=${resolved.reason})`);
  }
  const sb = getSupabase();
  if (!sb) {
    const pp = getOrInitMemProjectProfile(resolved.projectId);
    return {
      tokenHash: account.tokenHash,
      status: account.status,
      commandCount: account.commandCount,
      createdAt: pp.createdAt,
      lastSeenAt: pp.lastSeenAt,
      connected: pp.connected,
      onboarding: pp.onboarding,
      claudeMd: pp.claudeMd,
      project: resolved.slug,
      projectId: resolved.projectId,
    };
  }

  await sb
    .from("project_profiles")
    .upsert({ project_id: resolved.projectId }, { onConflict: "project_id" });

  const { data, error } = await sb
    .from("project_profiles")
    .select("*, projects!inner(slug, display_name)")
    .eq("project_id", resolved.projectId)
    .single();
  if (error || !data) throw new Error(`project_profiles select failed: ${error?.message ?? "no row"}`);
  const row = data as ProjectProfileRow;
  return buildProfileState({
    tokenHash: account.tokenHash,
    account,
    projectRow: row,
    slug: row.projects?.slug ?? resolved.slug,
    displayName: row.projects?.display_name ?? null,
  });
}

export async function getProfile(
  token: string,
  project: string | undefined,
): Promise<ProfileState | undefined> {
  const account = await ensureAccount(token);
  const resolved = await resolveProject({ token, slug: project, autoCreate: false });
  if (!resolved.projectId) return undefined;
  const sb = getSupabase();
  if (!sb) {
    const pp = getMem().projectProfiles.get(resolved.projectId);
    if (!pp) return undefined;
    return {
      tokenHash: account.tokenHash,
      status: account.status,
      commandCount: account.commandCount,
      createdAt: pp.createdAt,
      lastSeenAt: pp.lastSeenAt,
      connected: pp.connected,
      onboarding: pp.onboarding,
      claudeMd: pp.claudeMd,
      project: resolved.slug,
      projectId: resolved.projectId,
    };
  }
  const { data, error } = await sb
    .from("project_profiles")
    .select("*, projects!inner(slug, display_name)")
    .eq("project_id", resolved.projectId)
    .maybeSingle();
  if (error) throw new Error(`project_profiles select failed: ${error.message}`);
  if (!data) return undefined;
  const row = data as ProjectProfileRow;
  return buildProfileState({
    tokenHash: account.tokenHash,
    account,
    projectRow: row,
    slug: row.projects?.slug ?? resolved.slug,
    displayName: row.projects?.display_name ?? null,
  });
}

/** Account-level summary — for /account dashboard (GET /api/profile?token=... with no project). */
export async function getAccountState(token: string): Promise<AccountState> {
  const account = await ensureAccount(token);
  const hash = account.tokenHash;
  const sb = getSupabase();

  if (!sb) {
    const mem = getMem();
    const memProjectRows: ProjectRef[] = [];
    // Walk the mem projects list (indirectly via projectProfiles)
    // We don't keep a token → projects map in mem; build by intersecting the
    // project registry (resolveProject's mem store) with project_profiles.
    // Cheapest path: look at the shared global used by resolveProject.
    const projGlobal = Symbol.for("dwc.alpha.projects");
    type MemProject = { id: string; tokenHash: string; slug: string; displayName: string | null; createdAt: string; lastSeenAt: string };
    const gm = globalThis as unknown as Record<symbol, MemProject[] | undefined>;
    const list = (gm[projGlobal] ?? []).filter((p) => p.tokenHash === hash && !("deletedAt" in p));
    for (const p of list) {
      const pp = mem.projectProfiles.get(p.id);
      memProjectRows.push({
        slug: p.slug,
        displayName: p.displayName,
        commandCount: pp?.commandCount ?? 0,
        connected: pp?.connected ?? false,
        createdAt: p.createdAt,
        lastSeenAt: p.lastSeenAt,
      });
    }
    return {
      status: account.status,
      commandCount: account.commandCount,
      createdAt: account.createdAt,
      lastSeenAt: account.lastSeenAt,
      projects: memProjectRows.sort(
        (a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime(),
      ),
    };
  }

  const { data, error } = await sb
    .from("projects")
    .select("id, slug, display_name, created_at, last_seen_at, project_profiles(command_count, connected)")
    .eq("token_hash", hash)
    .is("deleted_at", null)
    .order("last_seen_at", { ascending: false });
  if (error) throw new Error(`projects list failed: ${error.message}`);

  const projects: ProjectRef[] = ((data ?? []) as Array<{
    id: string;
    slug: string;
    display_name: string | null;
    created_at: string;
    last_seen_at: string;
    project_profiles: Array<{ command_count: number | null; connected: boolean | null }> | null;
  }>).map((row) => {
    const pp = row.project_profiles?.[0];
    return {
      slug: row.slug,
      displayName: row.display_name,
      commandCount: pp?.command_count ?? 0,
      connected: pp?.connected ?? false,
      createdAt: row.created_at,
      lastSeenAt: row.last_seen_at,
    };
  });

  return {
    status: account.status,
    commandCount: account.commandCount,
    createdAt: account.createdAt,
    lastSeenAt: account.lastSeenAt,
    projects,
  };
}

/** Bumps the canonical per-designer counter (gating) AND the per-project counter (display).
 *  Atomic server-side via the rewritten increment_command_count(text, uuid) RPC. */
export async function incrementCommandCount(
  token: string,
  project: string | undefined,
): Promise<{ accountCount: number; projectCount: number }> {
  const hash = hashToken(token);
  const sb = getSupabase();
  if (!sb) {
    const account = getOrInitMemAccount(hash);
    account.commandCount += 1;
    account.lastSeenAt = now();

    const resolved = await resolveProject({ token, slug: project, autoCreate: true });
    const projectCount = resolved.projectId
      ? (() => {
          const pp = getOrInitMemProjectProfile(resolved.projectId!);
          pp.commandCount += 1;
          pp.lastSeenAt = now();
          return pp.commandCount;
        })()
      : 0;
    return { accountCount: account.commandCount, projectCount };
  }

  const resolved = await resolveProject({ token, slug: project, autoCreate: true });
  if (!resolved.projectId) throw new Error(`increment: project unresolved (${resolved.reason})`);

  const { data, error } = await sb.rpc("increment_command_count", {
    p_token_hash: hash,
    p_project_id: resolved.projectId,
  });
  if (error) throw new Error(`increment_command_count rpc failed: ${error.message}`);
  const projectCount = typeof data === "number" ? data : Number(data) || 0;

  // Read back the canonical designer counter for gating decisions upstream.
  const { data: account, error: accErr } = await sb
    .from("profiles")
    .select("command_count")
    .eq("token_hash", hash)
    .single();
  if (accErr || !account) throw new Error(`profiles read-back failed: ${accErr?.message ?? "no row"}`);
  return {
    accountCount: (account as { command_count: number }).command_count,
    projectCount,
  };
}

export async function setSubscriptionStatus(
  token: string,
  status: SubscriptionStatus,
): Promise<void> {
  const hash = hashToken(token);
  const sb = getSupabase();
  if (!sb) {
    const a = getOrInitMemAccount(hash);
    a.status = status;
    a.lastSeenAt = now();
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
  project: string | undefined,
  answers: OnboardingAnswers,
  claudeMd: string,
): Promise<ProfileState> {
  await ensureAccount(token);
  const resolved = await resolveProject({
    token,
    slug: project,
    autoCreate: true,
    displayName: answers.product_type,
  });
  if (!resolved.projectId) {
    throw new Error(`Could not resolve project (slug=${project ?? "∅"}, reason=${resolved.reason})`);
  }

  const sb = getSupabase();
  if (!sb) {
    const pp = getOrInitMemProjectProfile(resolved.projectId);
    pp.onboarding = answers;
    pp.claudeMd = claudeMd;
    pp.lastSeenAt = now();
    const profile = await getProfile(token, resolved.slug);
    if (!profile) throw new Error("profile vanished after mem upsert");
    return profile;
  }

  const { error } = await sb.from("project_profiles").upsert(
    {
      project_id: resolved.projectId,
      product_type: answers.product_type,
      product_description: answers.product_description,
      tech_stack: answers.tech_stack,
      design_system: answers.design_system,
      experience_level: answers.experience_level,
      tone_preference: answers.tone_preference,
      claude_md: claudeMd,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "project_id" },
  );
  if (error) throw new Error(`project_profiles upsert failed: ${error.message}`);

  const profile = await getProfile(token, resolved.slug);
  if (!profile) throw new Error("profile vanished immediately after upsert");
  return profile;
}

export async function recordEvent(
  payload: EventPayload,
): Promise<{ stored: StoredEvent; projectAutoCreated: boolean }> {
  const hash = hashToken(payload.token);
  const resolved = await resolveProject({
    token: payload.token,
    slug: payload.project,
    autoCreate: true,
  });
  if (!resolved.projectId) {
    throw new Error(`event project unresolved (${resolved.reason})`);
  }

  const sb = getSupabase();
  if (!sb) {
    const mem = getMem();
    const list = mem.events.get(resolved.projectId) ?? [];
    const stored: StoredEvent = {
      ...payload,
      id: randomId(),
      receivedAt: now(),
      project: resolved.slug,
    };
    list.push(stored);
    if (list.length > MAX_EVENTS_PER_TOKEN) {
      list.splice(0, list.length - MAX_EVENTS_PER_TOKEN);
    }
    mem.events.set(resolved.projectId, list);
    if (payload.toolName === "__mcp.connected__") {
      const pp = getOrInitMemProjectProfile(resolved.projectId);
      pp.connected = true;
      pp.lastSeenAt = now();
    }
    return { stored, projectAutoCreated: (resolved as ResolvedProject).created };
  }

  const { data, error } = await sb
    .from("companion_events")
    .insert({
      token_hash: hash,
      project_id: resolved.projectId,
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
      .from("project_profiles")
      .upsert(
        {
          project_id: resolved.projectId,
          connected: true,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "project_id" },
      );
  }

  const row = data as EventRow;
  return {
    stored: {
      id: row.id,
      token: "",
      toolName: row.tool_name,
      input: row.input,
      output: row.output,
      timestamp: row.event_timestamp,
      receivedAt: row.received_at,
      project: resolved.slug,
    },
    projectAutoCreated: (resolved as ResolvedProject).created,
  };
}

export async function getRecentEvents(
  token: string,
  project: string | undefined,
  limit = 50,
): Promise<StoredEvent[]> {
  const resolved = await resolveProject({ token, slug: project, autoCreate: false });
  if (!resolved.projectId) return [];
  const sb = getSupabase();
  if (!sb) {
    const list = getMem().events.get(resolved.projectId) ?? [];
    const sliceFrom = Math.max(0, list.length - limit);
    return list.slice(sliceFrom);
  }
  const capped = Math.min(200, Math.max(1, limit));
  const { data, error } = await sb
    .from("companion_events")
    .select("*")
    .eq("project_id", resolved.projectId)
    .order("received_at", { ascending: false })
    .limit(capped);
  if (error) throw new Error(`events select failed: ${error.message}`);
  return ((data ?? []) as EventRow[])
    .map((row) => ({
      id: row.id,
      token: "",
      toolName: row.tool_name,
      input: row.input,
      output: row.output,
      timestamp: row.event_timestamp,
      receivedAt: row.received_at,
      project: resolved.slug,
    }))
    .reverse();
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
  DEFAULT_PROJECT_SLUG,
} as const;

export { supabaseConfigured };
