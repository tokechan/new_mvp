-- Enforce a maximum number of chores per user (owner only).
-- SECURITY DEFINER ensures the count runs with the function owner's rights.
create or replace function public.enforce_chore_limit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  default_chore_limit constant integer := 3;
  chore_limit integer;
  target_owner uuid;
  current_count integer;
  exclude_id public.chores.id%TYPE;
begin
  target_owner := NEW.owner_id;

  if target_owner is null then
    return NEW;
  end if;

  select coalesce(
      (select max_chores from public.user_chore_limits where user_id = target_owner),
      default_chore_limit
    )
    into chore_limit;

  if chore_limit <= 0 then
    chore_limit := default_chore_limit;
  end if;

  if TG_OP = 'UPDATE' then
    exclude_id := OLD.id;
  else
    exclude_id := null;
  end if;

  select count(*)
    into current_count
  from public.chores
  where owner_id = target_owner
    and (exclude_id is null or id <> exclude_id)
    and coalesce(done, false) = false;

  if current_count >= chore_limit then
    raise exception using
      errcode = 'P0001',
      message = 'chore_limit_exceeded',
      detail = format('User %s already has %s chores; limit is %s.', target_owner, current_count, chore_limit),
      hint = '削除するか既存の家事を整理してから再試行してください。';
  end if;

  return NEW;
end;
$$;

drop trigger if exists enforce_chore_limit on public.chores;

create trigger enforce_chore_limit
before insert or update on public.chores
for each row
execute function public.enforce_chore_limit();

revoke execute on function public.enforce_chore_limit() from public;
-- grant execute on function public.enforce_chore_limit() to postgres;
-- grant execute on function public.enforce_chore_limit() to <your_admin_role>;
