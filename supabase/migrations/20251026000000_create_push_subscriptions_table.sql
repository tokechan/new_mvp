-- Create storage for Web Push subscriptions ahead of BFF integration.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null,
  expiration_time timestamptz,
  keys jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint endpoint_not_empty check (char_length(endpoint) > 0),
  constraint keys_has_required_fields check (
    jsonb_typeof(keys) = 'object'
    and keys ? 'p256dh'
    and keys ? 'auth'
  )
);

comment on table public.push_subscriptions is 'Stores Web Push subscriptions issued by browsers for each user.';
comment on column public.push_subscriptions.user_id is 'Supabase auth user that owns this subscription.';
comment on column public.push_subscriptions.endpoint is 'Push endpoint URL provided by the browser.';
comment on column public.push_subscriptions.expiration_time is 'Optional expiration timestamp from PushSubscription#expirationTime.';
comment on column public.push_subscriptions.keys is 'JSON payload containing auth and p256dh keys for encrypted push payloads.';

create unique index if not exists push_subscriptions_user_endpoint_idx
  on public.push_subscriptions (user_id, endpoint);

alter table public.push_subscriptions enable row level security;

create or replace function public.set_push_subscriptions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_push_subscriptions_updated_at on public.push_subscriptions;

create trigger set_push_subscriptions_updated_at
before update on public.push_subscriptions
for each row
execute procedure public.set_push_subscriptions_updated_at();

create policy "Users can manage their own push subscriptions"
on public.push_subscriptions
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
