-- Update the chore limit default to 10 and refresh trigger

BEGIN;

-- Recreate the enforce_chore_limit function with updated default
CREATE OR REPLACE FUNCTION public.enforce_chore_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  default_chore_limit CONSTANT integer := 10;
  chore_limit integer;
  target_owner uuid;
  current_count integer;
  exclude_id public.chores.id%TYPE;
BEGIN
  target_owner := NEW.owner_id;

  IF target_owner IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT coalesce(
      (SELECT max_chores FROM public.user_chore_limits WHERE user_id = target_owner),
      default_chore_limit
    )
    INTO chore_limit;

  IF chore_limit <= 0 THEN
    chore_limit := default_chore_limit;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    exclude_id := OLD.id;
  ELSE
    exclude_id := NULL;
  END IF;

  SELECT count(*)
    INTO current_count
  FROM public.chores
  WHERE owner_id = target_owner
    AND (exclude_id IS NULL OR id <> exclude_id)
    AND coalesce(done, false) = false;

  IF current_count >= chore_limit THEN
    RAISE EXCEPTION USING
      errcode = 'P0001',
      message = 'chore_limit_exceeded',
      detail = format('User %s already has %s chores; limit is %s.', target_owner, current_count, chore_limit),
      hint = '削除するか既存の家事を整理してから再試行してください。';
  END IF;

  RETURN NEW;
END;
$$;

-- Ensure trigger exists and references updated function
DROP TRIGGER IF EXISTS enforce_chore_limit ON public.chores;

CREATE TRIGGER enforce_chore_limit
BEFORE INSERT OR UPDATE ON public.chores
FOR EACH ROW
EXECUTE FUNCTION public.enforce_chore_limit();

COMMIT;
