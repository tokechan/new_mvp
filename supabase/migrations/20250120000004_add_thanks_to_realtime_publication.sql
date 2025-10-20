-- Ensure 'public.thanks' participates in Supabase Realtime publication
-- and set REPLICA IDENTITY for proper change payloads.

DO $$
DECLARE
  v_alltables boolean;
BEGIN
  SELECT p.alltables INTO v_alltables
  FROM pg_publication p
  WHERE p.pubname = 'supabase_realtime';

  -- If publication is FOR ALL TABLES, skip ADD TABLE to avoid 0A000 error
  IF COALESCE(v_alltables, false) THEN
    -- no-op
  ELSE
    -- Otherwise, add table only if not already present
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication p
      JOIN pg_publication_rel pr ON pr.prpubid = p.oid
      JOIN pg_class c ON c.oid = pr.prrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE p.pubname = 'supabase_realtime'
        AND n.nspname = 'public'
        AND c.relname = 'thanks'
    ) THEN
      BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.thanks;
      EXCEPTION
        WHEN others THEN
          -- Ignore in case of race condition or duplicate_object
          NULL;
      END;
    END IF;
  END IF;
END $$ LANGUAGE plpgsql;

-- Ensure full row data is available for UPDATE/DELETE events (safe for INSERT-only too)
ALTER TABLE public.thanks REPLICA IDENTITY FULL;

-- Optionally include completions as well if not yet published (uncomment if needed)
-- DO $$
-- BEGIN
--   IF NOT EXISTS (
--     SELECT 1
--     FROM pg_publication p
--     JOIN pg_publication_rel pr ON pr.prpubid = p.oid
--     JOIN pg_class c ON c.oid = pr.prrelid
--     JOIN pg_namespace n ON n.oid = c.relnamespace
--     WHERE p.pubname = 'supabase_realtime'
--       AND n.nspname = 'public'
--       AND c.relname = 'completions'
--   ) THEN
--     ALTER PUBLICATION supabase_realtime ADD TABLE public.completions;
--   END IF;
-- END $$;
-- ALTER TABLE public.completions REPLICA IDENTITY FULL;