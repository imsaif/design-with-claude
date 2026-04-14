-- dwc Phase 3 alpha schema
-- Run this in the Supabase SQL editor after creating a new project.
-- Scope: minimum tables to make the alpha flow (onboarding → gating → events) work
-- across serverless function instances. Later expansions (design_artifacts,
-- command_history, Dodo subscriptions) can be layered on without breaking this.

create table if not exists public.profiles (
    id uuid primary key default gen_random_uuid(),
    token_hash text unique not null,
    product_type text,
    product_description text,
    tech_stack text[] not null default '{}',
    design_system text,
    experience_level text,
    tone_preference text,
    claude_md text,
    status text not null default 'free', -- 'free' | 'paid' | 'cancelled'
    command_count integer not null default 0,
    connected boolean not null default false,
    created_at timestamptz not null default now(),
    last_seen_at timestamptz not null default now(),
    subscription_started_at timestamptz,
    subscription_cancelled_at timestamptz
);

create index if not exists profiles_token_hash_idx on public.profiles (token_hash);

create table if not exists public.companion_events (
    id uuid primary key default gen_random_uuid(),
    token_hash text not null,
    tool_name text not null,
    input jsonb not null default '{}'::jsonb,
    output jsonb not null default '{}'::jsonb,
    event_timestamp timestamptz not null,
    received_at timestamptz not null default now()
);

create index if not exists companion_events_token_recent_idx
    on public.companion_events (token_hash, received_at desc);

-- Row-Level Security: the API routes use the service_role key server-side, so we
-- keep RLS enabled but add no policies — that blocks the anon key from reading
-- anything. If you later expose Supabase Realtime directly to the browser, add
-- policies scoped by token_hash at that point.

alter table public.profiles enable row level security;
alter table public.companion_events enable row level security;

-- Atomic counter increment so concurrent gating/consume requests don't race.
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
        set command_count = profiles.command_count + 1,
            last_seen_at = now()
    returning command_count into new_count;
    return new_count;
end;
$$;
