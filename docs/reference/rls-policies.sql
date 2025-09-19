-- RLS（Row Level Security）ポリシー設定
-- Supabase/PostgreSQLで実行

-- Realtime Publication設定（リアルタイム機能に必要）
-- 既存のpublicationを確認
-- SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- choresテーブルをリアルタイム対象に追加（必要に応じて実行）
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.chores;
-- または、すべてのテーブルを対象にする場合：
-- ALTER PUBLICATION supabase_realtime SET TABLE public.chores, public.completions, public.thanks, public.profiles;

-- REPLICA IDENTITYの設定（UPDATE/DELETEイベントに必要）
-- ALTER TABLE public.chores REPLICA IDENTITY FULL;
-- ALTER TABLE public.completions REPLICA IDENTITY FULL;
-- ALTER TABLE public.thanks REPLICA IDENTITY FULL;

-- スキーマ作成（MVPミニERD）
-- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text
);

-- chores
create table if not exists public.chores (
  id bigserial primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  partner_id uuid references auth.users(id) on delete set null,
  title text not null,
  done boolean not null default false
);

-- completions
create table if not exists public.completions (
  id bigserial primary key,
  chore_id bigint not null references public.chores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- thanks
create table if not exists public.thanks (
  id bigserial primary key,
  from_id uuid not null references auth.users(id) on delete cascade,
  to_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

-- RLS有効化
alter table public.profiles    enable row level security;
alter table public.chores      enable row level security;
alter table public.completions enable row level security;
alter table public.thanks      enable row level security;

-- profiles: 自分のプロフィールだけ見れる/更新できる
create policy "profiles_select_own"
on public.profiles for select
using (id = auth.uid());

create policy "profiles_upsert_own"
on public.profiles for all
using (id = auth.uid())
with check (id = auth.uid());

-- chores: 自分がowner or partnerの行だけアクセス可能
create policy "chores_select_owner_or_partner"
on public.chores for select
using (owner_id = auth.uid() or partner_id = auth.uid());

create policy "chores_insert_owner_only"
on public.chores for insert
with check (owner_id = auth.uid());

create policy "chores_update_owner_or_partner"
on public.chores for update
using (owner_id = auth.uid() or partner_id = auth.uid())
with check (owner_id = auth.uid() or partner_id = auth.uid());

create policy "chores_delete_owner_or_partner"
on public.chores for delete
using (owner_id = auth.uid() or partner_id = auth.uid());

-- completions: 見えるのは関係者、insertは自分の分だけ
create policy "completions_select_related"
on public.completions for select
using (
  exists (select 1 from public.chores c
          where c.id = completions.chore_id
            and (c.owner_id = auth.uid() or c.partner_id = auth.uid()))
);

create policy "completions_insert_self"
on public.completions for insert
with check (user_id = auth.uid());

-- thanks: 自分が当事者のもののみ、insertはfrom_id=自分
create policy "thanks_select_related"
on public.thanks for select
using (from_id = auth.uid() or to_id = auth.uid());

create policy "thanks_insert_self"
on public.thanks for insert
with check (from_id = auth.uid());

-- （必要ならupdate/deleteも同様に）