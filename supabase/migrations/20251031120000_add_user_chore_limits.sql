-- Allow per-user overrides for chore creation limits.
-- Default limit remains in enforce_chore_limit(), but this table lets us adjust
-- the cap (e.g., by subscription plan) without redeploying SQL.

create table if not exists public.user_chore_limits (
  user_id uuid primary key references auth.users (id) on delete cascade,
  max_chores integer not null check (max_chores > 0),
  updated_at timestamptz not null default now()
);

comment on table public.user_chore_limits is 'Optional per-user overrides for chore creation caps.';
comment on column public.user_chore_limits.max_chores is 'Maximum number of active (undone) chores allowed for this user.';
