-- 002_email.sql
-- Captures the email entered at the /get-started gate. Nullable, no unique
-- constraint — a designer may legitimately re-mint a token under the same
-- email after losing the previous one.
-- Apply via Supabase SQL editor or `supabase db push`.

alter table public.profiles
  add column if not exists email text;

create index if not exists profiles_email_idx
  on public.profiles (email)
  where email is not null;
