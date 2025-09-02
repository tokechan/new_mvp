-- RLS 有効化
alter table public.profiles    enable row level security;
alter table public.chores      enable row level security;
alter table public.completions enable row level security;
alter table public.thanks      enable row level security;

-- profiles: 自分のみ閲覧/更新
create policy profiles_select_own on public.profiles for select using (id = auth.uid());
create policy profiles_upsert_own on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());

-- chores: owner or partner のみ
create policy chores_select_owner_or_partner on public.chores for select
  using (owner_id = auth.uid() or partner_id = auth.uid());
create policy chores_insert_owner_only on public.chores for insert
  with check (owner_id = auth.uid());
create policy chores_update_owner_or_partner on public.chores for update
  using (owner_id = auth.uid() or partner_id = auth.uid())
  with check (owner_id = auth.uid() or partner_id = auth.uid());

-- completions: 関係者のみ閲覧、自分のみ挿入
create policy completions_select_related on public.completions for select
  using (exists (select 1 from public.chores c where c.id = completions.chore_id
                 and (c.owner_id = auth.uid() or c.partner_id = auth.uid())));
create policy completions_insert_self on public.completions for insert
  with check (user_id = auth.uid());

-- thanks: 当事者のみ閲覧、from=自分のみ挿入
create policy thanks_select_related on public.thanks for select
  using (from_id = auth.uid() or to_id = auth.uid());
create policy thanks_insert_self on public.thanks for insert
  with check (from_id = auth.uid());}}}