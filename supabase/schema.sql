-- SQL Detective (CrimeOS) — Supabase schema.
--
-- This file is DOCUMENTATION. Run it manually in the Supabase dashboard
-- (SQL editor) for your project. It is idempotent: safe to re-run.
--
-- Auth + cross-device persistence only. The query engine, cases, and game
-- logic are untouched by the app; this just stores per-user progress + notes.
--
-- NOTE ON ORDER: tables are created first, THEN row-level security is enabled,
-- THEN policies are added. (The original brief enabled RLS before the tables
-- existed, which silently did nothing on a fresh project.)

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- One row per user. Mirrors the in-app useCaseStore game state.
create table if not exists user_progress (
  id uuid references auth.users on delete cascade primary key,
  completed_cases text[] not null default '{}',
  active_case_id text default null,
  xp integer not null default 0,
  settings jsonb not null default '{"crtFilter": true, "soundEnabled": false}',
  -- Extra fields the live game tracks, kept so progression syncs fully across
  -- devices (not in the original brief, which would have dropped them):
  hints_used jsonb not null default '{}',          -- caseId -> highest hint index shown
  opened_cases text[] not null default '{}',       -- cases whose dispatch email was opened
  desktop_icons_created text[] not null default '{}', -- cases that already seeded a desktop folder
  updated_at timestamptz not null default now()
);

-- One row per user per case — the detective's scratchpad notes.
create table if not exists user_notes (
  user_id uuid references auth.users on delete cascade,
  case_id text not null,
  content text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, case_id)
);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table user_progress enable row level security;
alter table user_notes enable row level security;

-- Policies are not "create ... if not exists" in older Postgres, so drop first.
drop policy if exists "Users can read own progress" on user_progress;
drop policy if exists "Users can upsert own progress" on user_progress;
drop policy if exists "Users can update own progress" on user_progress;
drop policy if exists "Users can read own notes" on user_notes;
drop policy if exists "Users can upsert own notes" on user_notes;
drop policy if exists "Users can update own notes" on user_notes;

create policy "Users can read own progress"
  on user_progress for select
  using (auth.uid() = id);

create policy "Users can upsert own progress"
  on user_progress for insert
  with check (auth.uid() = id);

create policy "Users can update own progress"
  on user_progress for update
  using (auth.uid() = id);

create policy "Users can read own notes"
  on user_notes for select
  using (auth.uid() = user_id);

create policy "Users can upsert own notes"
  on user_notes for insert
  with check (auth.uid() = user_id);

create policy "Users can update own notes"
  on user_notes for update
  using (auth.uid() = user_id);
