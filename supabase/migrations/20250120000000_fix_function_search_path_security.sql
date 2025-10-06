-- Fix Function Search Path Mutable security warnings
-- This migration addresses PostgreSQL security warnings by explicitly setting search_path for functions
-- Created: 2025-01-20
-- Security Issue: Function Search Path Mutable warnings for multiple functions

-- ==========================================
-- 1. cleanup_expired_invitations関数の修正
-- ==========================================

-- 既存の関数を削除
DROP FUNCTION IF EXISTS cleanup_expired_invitations();

-- セキュアな関数を再作成（search_pathを明示的に設定）
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 期限切れの招待を期限切れ状態に更新
  UPDATE public.partner_invitations 
  SET status = 'expired'
  WHERE status = 'pending' 
    AND expires_at < NOW();
END;
$$;

-- 関数の所有者とコメントを設定
ALTER FUNCTION cleanup_expired_invitations() OWNER TO postgres;
COMMENT ON FUNCTION cleanup_expired_invitations() IS 'セキュリティ修正済み: 期限切れ招待の自動削除（search_path固定）';

-- ==========================================
-- 2. generate_invite_code関数の修正
-- ==========================================

-- 既存の関数を削除
DROP FUNCTION IF EXISTS generate_invite_code();

-- セキュアな関数を再作成（search_pathを明示的に設定）
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- UUID v4から招待コードを生成（ハイフンを除去して短縮）
  -- gen_random_uuid()はPostgreSQL標準関数なので安全
  RETURN REPLACE(gen_random_uuid()::TEXT, '-', '');
END;
$$;

-- 関数の所有者とコメントを設定
ALTER FUNCTION generate_invite_code() OWNER TO postgres;
COMMENT ON FUNCTION generate_invite_code() IS 'セキュリティ修正済み: 招待コード生成（search_path固定）';

-- ==========================================
-- 3. link_partners関数の修正
-- ==========================================

-- 既存の関数を削除
DROP FUNCTION IF EXISTS link_partners(TEXT, UUID);

-- セキュアな関数を再作成（search_pathを明示的に設定）
CREATE OR REPLACE FUNCTION link_partners(
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
BEGIN
  -- 有効な招待を取得
  SELECT * INTO v_invitation
  FROM public.partner_invitations
  WHERE invite_code = p_invite_code
    AND status = 'pending'
    AND expires_at > NOW();
  
  -- 招待が見つからない場合
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  v_inviter_id := v_invitation.inviter_id;
  
  -- 既にパートナーがいる場合はエラー
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id IN (v_inviter_id, p_accepter_id) 
      AND partner_id IS NOT NULL
  ) THEN
    RETURN FALSE;
  END IF;
  
  -- パートナー関係を設定
  UPDATE public.profiles 
  SET partner_id = p_accepter_id, partnership_created_at = NOW()
  WHERE id = v_inviter_id;
  
  UPDATE public.profiles 
  SET partner_id = v_inviter_id, partnership_created_at = NOW()
  WHERE id = p_accepter_id;
  
  -- 招待を受諾済みに更新
  UPDATE public.partner_invitations
  SET status = 'accepted', 
      accepted_at = NOW(), 
      accepted_by = p_accepter_id
  WHERE id = v_invitation.id;
  
  -- 既存の家事にパートナーIDを設定
  UPDATE public.chores
  SET partner_id = p_accepter_id
  WHERE owner_id = v_inviter_id AND partner_id IS NULL;
  
  RETURN TRUE;
END;
$$;

-- 関数の所有者とコメントを設定
ALTER FUNCTION link_partners(TEXT, UUID) OWNER TO postgres;
COMMENT ON FUNCTION link_partners(TEXT, UUID) IS 'セキュリティ修正済み: パートナー連携処理（search_path固定）';

-- ==========================================
-- 4. insert_chore_bypass_rls関数の作成
-- ==========================================

-- RLSをバイパスして家事を挿入する関数（テスト環境用）
CREATE OR REPLACE FUNCTION insert_chore_bypass_rls(
  p_owner_id UUID,
  p_partner_id UUID DEFAULT NULL,
  p_title TEXT
)
RETURNS TABLE(
  id bigint,
  title TEXT,
  owner_id UUID,
  partner_id UUID,
  done boolean,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- RLSをバイパスして家事を挿入
  RETURN QUERY
  INSERT INTO public.chores (owner_id, partner_id, title, done, created_at)
  VALUES (p_owner_id, p_partner_id, p_title, false, NOW())
  RETURNING 
    public.chores.id,
    public.chores.title,
    public.chores.owner_id,
    public.chores.partner_id,
    public.chores.done,
    public.chores.created_at;
END;
$$;

-- 関数の所有者とコメントを設定
ALTER FUNCTION insert_chore_bypass_rls(UUID, UUID, TEXT) OWNER TO postgres;
COMMENT ON FUNCTION insert_chore_bypass_rls(UUID, UUID, TEXT) IS 'セキュリティ修正済み: RLSバイパス家事挿入（search_path固定）';

-- ==========================================
-- 5. セキュリティ設定の確認
-- ==========================================

-- 作成した関数の権限を確認（必要に応じて調整）
-- REVOKE ALL ON FUNCTION cleanup_expired_invitations() FROM PUBLIC;
-- REVOKE ALL ON FUNCTION generate_invite_code() FROM PUBLIC;
-- REVOKE ALL ON FUNCTION link_partners(TEXT, UUID) FROM PUBLIC;
-- REVOKE ALL ON FUNCTION insert_chore_bypass_rls(UUID, UUID, TEXT) FROM PUBLIC;

-- 必要なロールに実行権限を付与
-- GRANT EXECUTE ON FUNCTION cleanup_expired_invitations() TO authenticated;
-- GRANT EXECUTE ON FUNCTION generate_invite_code() TO authenticated;
-- GRANT EXECUTE ON FUNCTION link_partners(TEXT, UUID) TO authenticated;
-- GRANT EXECUTE ON FUNCTION insert_chore_bypass_rls(UUID, UUID, TEXT) TO authenticated;

-- ==========================================
-- 6. マイグレーション完了確認
-- ==========================================

-- マイグレーション実行確認用のコメント
COMMENT ON SCHEMA public IS 'セキュリティ修正完了: Function Search Path Mutable warnings addressed - Migration 20250120000000';

-- マイグレーション完了ログ
DO $$
BEGIN
  RAISE NOTICE 'Security Migration 20250120000000: Function search_path security fixes applied at %', NOW();
  RAISE NOTICE 'Fixed functions: cleanup_expired_invitations, generate_invite_code, link_partners, insert_chore_bypass_rls';
  RAISE NOTICE 'All functions now have explicit search_path=public setting for security';
END
$$;