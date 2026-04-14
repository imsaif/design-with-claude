-- dwc 2.0.0-alpha.2 — multi-project support
-- Introduces per-project scoping while preserving all existing alpha.1 data.
-- Safe to re-run: every statement is idempotent (IF NOT EXISTS / ON CONFLICT / WHERE).
--
-- Apply via the Supabase SQL Editor. Verify with:
--   select count(*) from profiles;         -- should equal
--   select count(*) from projects;
--   select * from project_profiles limit 5;
--   select count(*) from companion_events where project_id is null; -- should be 0

-- ---------------------------------------------------------------
-- 1. New tables
-- ---------------------------------------------------------------

create table if not exists public.projects (
    id uuid primary key default gen_random_uuid(),
    token_hash text not null,
    slug text not null,
    display_name text,
    created_at timestamptz not null default now(),
    last_seen_at timestamptz not null default now(),
    deleted_at timestamptz,
    unique (token_hash, slug)
);

create index if not exists projects_token_recent_idx
    on public.projects (token_hash, last_seen_at desc);

create table if not exists public.project_profiles (
    project_id uuid primary key references public.projects(id) on delete cascade,
    product_type text,
    product_description text,
    tech_stack text[] not null default '{}',
    design_system text,
    experience_level text,
    tone_preference text,
    claude_md text,
    command_count integer not null default 0,
    connected boolean not null default false,
    created_at timestamptz not null default now(),
    last_seen_at timestamptz not null default now()
);

-- RLS stays on; no policies means service_role only (same as profiles).
alter table public.projects enable row level security;
alter table public.project_profiles enable row level security;

-- ---------------------------------------------------------------
-- 2. Scope companion_events by project
-- ---------------------------------------------------------------

alter table public.companion_events
    add column if not exists project_id uuid references public.projects(id) on delete cascade;

create index if not exists companion_events_project_recent_idx
    on public.companion_events (project_id, received_at desc);

-- ---------------------------------------------------------------
-- 3. Backfill — give every existing designer a 'default' project and
--    rehome their onboarding answers + events under it.
-- ---------------------------------------------------------------

insert into public.projects (token_hash, slug, display_name, created_at, last_seen_at)
select p.token_hash, 'default', 'Default project', p.created_at, p.last_seen_at
from public.profiles p
on conflict (token_hash, slug) do nothing;

insert into public.project_profiles (
    project_id,
    product_type,
    product_description,
    tech_stack,
    design_system,
    experience_level,
    tone_preference,
    claude_md,
    command_count,
    connected,
    created_at,
    last_seen_at
)
select
    pr.id,
    p.product_type,
    p.product_description,
    coalesce(p.tech_stack, '{}'),
    p.design_system,
    p.experience_level,
    p.tone_preference,
    p.claude_md,
    p.command_count,
    p.connected,
    p.created_at,
    p.last_seen_at
from public.profiles p
join public.projects pr
  on pr.token_hash = p.token_hash and pr.slug = 'default'
on conflict (project_id) do nothing;

update public.companion_events ce
   set project_id = pr.id
  from public.projects pr
 where ce.token_hash = pr.token_hash
   and pr.slug = 'default'
   and ce.project_id is null;

-- ---------------------------------------------------------------
-- 4. Rewrite the gating RPC — bump BOTH counters atomically.
--    profiles.command_count stays canonical for the per-designer free tier
--    (10 total across projects); project_profiles.command_count is for the
--    /account dashboard's per-project breakdown.
-- ---------------------------------------------------------------

create or replace function public.increment_command_count(
    p_token_hash text,
    p_project_id uuid
) returns integer
language plpgsql
as $$
declare
    new_count integer;
begin
    -- Per-designer counter (gating)
    insert into public.profiles (token_hash, command_count, last_seen_at)
    values (p_token_hash, 1, now())
    on conflict (token_hash) do update
        set command_count = public.profiles.command_count + 1,
            last_seen_at = now();

    -- Per-project counter (informational)
    update public.project_profiles
       set command_count = command_count + 1,
           last_seen_at = now()
     where project_id = p_project_id
    returning command_count into new_count;

    return new_count;
end;
$$;

-- Old single-arg signature (alpha.1) stays available for a grace window so
-- Phase 2 rollout doesn't hit 42883 errors if a Vercel instance is slow to
-- redeploy. Remove once Phase 3 ships.
create or replace function public.increment_command_count(p_token_hash text)
returns integer
language plpgsql
as $$
declare
    new_count integer;
begin
    insert into public.profiles (token_hash, command_count, last_seen_at)
    values (p_token_hash, 1, now())
    on conflict (token_hash) do update
        set command_count = public.profiles.command_count + 1,
            last_seen_at = now()
    returning command_count into new_count;
    return new_count;
end;
$$;
