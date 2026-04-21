import { getSupabase } from "./supabase";
import { hashToken } from "./tokens";
import { DEFAULT_PROJECT_SLUG, PROJECT_SLUG_PATTERN } from "./types";

const IMPLICIT_ALLOWED = process.env.DWIC_ALLOW_IMPLICIT_PROJECT !== "off";

export function isValidSlug(slug: string | null | undefined): slug is string {
  if (!slug) return false;
  return PROJECT_SLUG_PATTERN.test(slug);
}

/** Coerce a caller-supplied slug into something resolvable.
 *  Empty / missing → 'default' only when implicit projects are allowed. */
export function normalizeSlug(slug: string | undefined | null): string | null {
  const trimmed = slug?.trim();
  if (trimmed && isValidSlug(trimmed)) return trimmed;
  if (!trimmed && IMPLICIT_ALLOWED) return DEFAULT_PROJECT_SLUG;
  return null;
}

export interface ResolveOptions {
  token: string;
  slug: string | undefined | null;
  /** Create the project on-the-fly if it doesn't exist. MCP/setup calls do; web UX POSTs usually don't. */
  autoCreate?: boolean;
  displayName?: string;
}

export interface ResolvedProject {
  projectId: string;
  slug: string;
  created: boolean;
  reason?: "invalid_slug" | "not_found";
}

// In-memory fallback used when Supabase isn't configured (local dev).
type MemProject = {
  id: string;
  tokenHash: string;
  slug: string;
  displayName: string | null;
  createdAt: string;
  lastSeenAt: string;
};
const memGlobalKey = Symbol.for("dwic.alpha.projects");
const mg = globalThis as unknown as Record<symbol, MemProject[] | undefined>;
function memList(): MemProject[] {
  if (!mg[memGlobalKey]) mg[memGlobalKey] = [];
  return mg[memGlobalKey]!;
}
function memRandomId(): string {
  return (
    "p_" +
    Math.random().toString(36).slice(2, 10) +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 6)
  );
}

/** Resolve a (token, slug) pair to a project row. Used by every API route. */
export async function resolveProject(opts: ResolveOptions): Promise<ResolvedProject | { projectId: null; slug: null; created: false; reason: "invalid_slug" | "not_found" }> {
  const slug = normalizeSlug(opts.slug);
  if (!slug) return { projectId: null, slug: null, created: false, reason: "invalid_slug" };

  const tokenHash = hashToken(opts.token);
  const sb = getSupabase();

  if (!sb) {
    // In-memory fallback
    const existing = memList().find(
      (p) => p.tokenHash === tokenHash && p.slug === slug,
    );
    if (existing) {
      existing.lastSeenAt = new Date().toISOString();
      return { projectId: existing.id, slug, created: false };
    }
    if (!opts.autoCreate) {
      return { projectId: null, slug: null, created: false, reason: "not_found" };
    }
    const now = new Date().toISOString();
    const row: MemProject = {
      id: memRandomId(),
      tokenHash,
      slug,
      displayName: opts.displayName ?? null,
      createdAt: now,
      lastSeenAt: now,
    };
    memList().push(row);
    return { projectId: row.id, slug, created: true };
  }

  // Supabase path
  const { data: existing, error: selErr } = await sb
    .from("projects")
    .select("id")
    .eq("token_hash", tokenHash)
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();
  if (selErr) throw new Error(`projects select failed: ${selErr.message}`);
  if (existing?.id) {
    await sb
      .from("projects")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", existing.id);
    return { projectId: existing.id as string, slug, created: false };
  }

  if (!opts.autoCreate) {
    return { projectId: null, slug: null, created: false, reason: "not_found" };
  }

  const { data: inserted, error: insErr } = await sb
    .from("projects")
    .insert({
      token_hash: tokenHash,
      slug,
      display_name: opts.displayName ?? null,
    })
    .select("id")
    .single();
  if (insErr || !inserted) {
    // Handle races: another writer created the row between our select and insert.
    const { data: after } = await sb
      .from("projects")
      .select("id")
      .eq("token_hash", tokenHash)
      .eq("slug", slug)
      .is("deleted_at", null)
      .maybeSingle();
    if (after?.id) return { projectId: after.id as string, slug, created: false };
    throw new Error(`projects insert failed: ${insErr?.message ?? "no row"}`);
  }

  // Make sure the per-project profile row exists (onboarding will fill it later).
  await sb
    .from("project_profiles")
    .upsert({ project_id: inserted.id }, { onConflict: "project_id" });

  return { projectId: inserted.id as string, slug, created: true };
}
