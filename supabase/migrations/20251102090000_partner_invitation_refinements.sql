-- Partner invitation refinements
-- Created: 2025-11-02
-- Adds inviter metadata, strengthens link_partners guard rails,
-- and ensures partner invitation cleanup remains idempotent.

BEGIN;

-- ==========================================
-- 1. Augment partner_invitations with inviter metadata
-- ==========================================

ALTER TABLE public.partner_invitations
  ADD COLUMN IF NOT EXISTS inviter_name TEXT,
  ADD COLUMN IF NOT EXISTS inviter_email TEXT;

-- Backfill inviter metadata where possible
UPDATE public.partner_invitations AS pi
SET inviter_name = COALESCE(pi.inviter_name, p.display_name),
    inviter_email = COALESCE(pi.inviter_email, au.email)
FROM public.profiles AS p
LEFT JOIN auth.users AS au ON au.id = pi.inviter_id
WHERE pi.inviter_id = p.id
  AND (pi.inviter_name IS NULL OR pi.inviter_email IS NULL);

-- ==========================================
-- 2. Recreate link_partners with self-invite guard
-- ==========================================

DROP FUNCTION IF EXISTS public.link_partners(TEXT, UUID);

CREATE OR REPLACE FUNCTION public.link_partners(
  p_invite_code TEXT,
  p_accepter_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation public.partner_invitations%ROWTYPE;
  v_inviter_id UUID;
  v_updated_inviter INTEGER;
  v_updated_accepter INTEGER;
BEGIN
  -- Fetch a valid invitation
  SELECT * INTO v_invitation
  FROM public.partner_invitations
  WHERE invite_code = p_invite_code
    AND status = 'pending'
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  v_inviter_id := v_invitation.inviter_id;

  -- Prevent an inviter from accepting their own invitation
  IF v_inviter_id = p_accepter_id THEN
    RAISE EXCEPTION 'SELF_LINK_NOT_ALLOWED'
      USING ERRCODE = 'P0001';
  END IF;

  -- Ensure neither user already has a partner
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id IN (v_inviter_id, p_accepter_id)
      AND partner_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'PARTNERSHIP_ALREADY_EXISTS'
      USING ERRCODE = 'P0001';
  END IF;

  -- Update inviter profile
  UPDATE public.profiles
  SET partner_id = p_accepter_id,
      partnership_created_at = NOW()
  WHERE id = v_inviter_id
  RETURNING 1 INTO v_updated_inviter;

  IF v_updated_inviter IS NULL THEN
    RAISE EXCEPTION 'INVITER_PROFILE_NOT_FOUND'
      USING ERRCODE = 'P0001';
  END IF;

  -- Update accepter profile
  UPDATE public.profiles
  SET partner_id = v_inviter_id,
      partnership_created_at = NOW()
  WHERE id = p_accepter_id
  RETURNING 1 INTO v_updated_accepter;

  IF v_updated_accepter IS NULL THEN
    RAISE EXCEPTION 'ACCEPTER_PROFILE_NOT_FOUND'
      USING ERRCODE = 'P0001';
  END IF;

  -- Mark invitation as accepted
  UPDATE public.partner_invitations
  SET status = 'accepted',
      accepted_at = NOW(),
      accepted_by = p_accepter_id
  WHERE id = v_invitation.id;

  -- Attach existing chores to the new partner
  UPDATE public.chores
  SET partner_id = p_accepter_id
  WHERE owner_id = v_inviter_id
    AND partner_id IS NULL;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    -- Explicitly roll back profile links on handled errors
    IF v_inviter_id IS NOT NULL OR p_accepter_id IS NOT NULL THEN
      UPDATE public.profiles
      SET partner_id = NULL,
          partnership_created_at = NULL
      WHERE id IN (v_inviter_id, p_accepter_id);
    END IF;
    RAISE;
END;
$$;

COMMENT ON FUNCTION public.link_partners(TEXT, UUID)
  IS 'Partner invitation acceptance with self-invite guard and transactional rollback safety.';

COMMIT;
