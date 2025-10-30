-- Enforce a maximum number of chores per user (owner or partner).
-- SECURITY DEFINER ensures the count runs with the function owner's rights.
create or replace function public.enforce_chore_limit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  chore_limit constant integer := 10;
  raw_users uuid[] := array_remove(array[NEW.owner_id, NEW.partner_id], null);
  affected_users uuid[];
  target_user uuid;
  current_count integer;
  exclude_id public.chores.id%TYPE;
begin
  -- Deduplicate users that will be associated with the row.
  select coalesce(array_agg(distinct user_id), '{}')
    into affected_users
  from unnest(raw_users) as user_id;

  if array_length(affected_users, 1) is null then
    return NEW;
  end if;

  if TG_OP = 'UPDATE' then
    exclude_id := OLD.id;
  else
    exclude_id := null;
  end if;

  foreach target_user in array affected_users loop
    select count(*)
      into current_count
    from public.chores
    where (owner_id = target_user or partner_id = target_user)
      and (exclude_id is null or id <> exclude_id)
      and coalesce(done, false) = false;

    if current_count >= chore_limit then
      raise exception using
        errcode = 'P0001',
        message = 'chore_limit_exceeded',
        detail = format('User %s already has %s chores; limit is %s.', target_user, current_count, chore_limit),
        hint = '削除するか既存の家事を整理してから再試行してください。';
    end if;
  end loop;

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
