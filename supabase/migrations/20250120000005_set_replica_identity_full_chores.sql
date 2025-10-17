-- Set REPLICA IDENTITY FULL on chores to ensure UPDATE payloads include old values
-- This helps Real-time handlers that compare old/new fields reliably.

ALTER TABLE public.chores REPLICA IDENTITY FULL;