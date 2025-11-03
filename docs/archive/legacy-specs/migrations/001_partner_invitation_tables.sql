-- パートナー招待機能のためのデータベースマイグレーション
-- 作成日: 2025-09-07
-- 説明: partner_invitationsテーブルの作成とprofilesテーブルの拡張

-- ==========================================
-- 1. partner_invitations テーブル作成
-- ==========================================

CREATE TABLE IF NOT EXISTS partner_invitations (
  id BIGSERIAL PRIMARY KEY,
  inviter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE NOT NULL,
  invitee_email TEXT, -- オプション: 招待先メールアドレス
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_partner_invitations_invite_code ON partner_invitations(invite_code);
CREATE INDEX IF NOT EXISTS idx_partner_invitations_inviter_id ON partner_invitations(inviter_id);
CREATE INDEX IF NOT EXISTS idx_partner_invitations_status ON partner_invitations(status);
CREATE INDEX IF NOT EXISTS idx_partner_invitations_expires_at ON partner_invitations(expires_at);

-- ==========================================
-- 2. profiles テーブル拡張
-- ==========================================

-- パートナー関係を管理するカラムを追加
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS partnership_created_at TIMESTAMPTZ;

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_profiles_partner_id ON profiles(partner_id);

-- ==========================================
-- 3. chores テーブル拡張（created_atカラム追加）
-- ==========================================

-- 既存のchoresテーブルにcreated_atカラムを追加（ERDに合わせる）
ALTER TABLE chores 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_chores_created_at ON chores(created_at);

-- ==========================================
-- 4. RLS (Row Level Security) ポリシー設定
-- ==========================================

-- partner_invitations テーブルのRLS有効化
ALTER TABLE partner_invitations ENABLE ROW LEVEL SECURITY;

-- 招待者は自分の招待のみ閲覧・操作可能
CREATE POLICY "Users can view their own invitations" ON partner_invitations
  FOR SELECT USING (inviter_id = auth.uid());

CREATE POLICY "Users can create invitations" ON partner_invitations
  FOR INSERT WITH CHECK (inviter_id = auth.uid());

CREATE POLICY "Users can update their own invitations" ON partner_invitations
  FOR UPDATE USING (inviter_id = auth.uid());

-- 招待コードによる公開アクセス（招待受諾用）
CREATE POLICY "Public can view valid invitations by code" ON partner_invitations
  FOR SELECT USING (
    status = 'pending' AND 
    expires_at > NOW()
  );

-- ==========================================
-- 5. profiles テーブルのRLSポリシー更新
-- ==========================================

-- 既存のポリシーを削除して再作成（パートナー情報の閲覧権限を追加）
DROP POLICY IF EXISTS "Users can view partner profile" ON profiles;

-- パートナー情報の閲覧権限を含む新しいポリシー
CREATE POLICY "Users can view own and partner profile" ON profiles
  FOR SELECT USING (
    id = auth.uid() OR 
    partner_id = auth.uid() OR 
    id = (SELECT partner_id FROM profiles WHERE id = auth.uid())
  );

-- ユーザーは自分のプロフィールのみ更新可能
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- ==========================================
-- 6. 期限切れ招待の自動削除関数
-- ==========================================

-- 期限切れ招待を自動的に削除する関数
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void AS $$
BEGIN
  UPDATE partner_invitations 
  SET status = 'expired'
  WHERE status = 'pending' 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 7. パートナー連携処理関数
-- ==========================================

-- パートナー連携を実行する関数
CREATE OR REPLACE FUNCTION link_partners(
  p_invite_code TEXT,
  p_accepter_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_invitation partner_invitations%ROWTYPE;
  v_inviter_id UUID;
BEGIN
  -- 有効な招待を取得
  SELECT * INTO v_invitation
  FROM partner_invitations
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
    SELECT 1 FROM profiles 
    WHERE id IN (v_inviter_id, p_accepter_id) 
      AND partner_id IS NOT NULL
  ) THEN
    RETURN FALSE;
  END IF;
  
  -- パートナー関係を設定
  UPDATE profiles 
  SET partner_id = p_accepter_id, partnership_created_at = NOW()
  WHERE id = v_inviter_id;
  
  UPDATE profiles 
  SET partner_id = v_inviter_id, partnership_created_at = NOW()
  WHERE id = p_accepter_id;
  
  -- 招待を受諾済みに更新
  UPDATE partner_invitations
  SET status = 'accepted', 
      accepted_at = NOW(), 
      accepted_by = p_accepter_id
  WHERE id = v_invitation.id;
  
  -- 既存の家事にパートナーIDを設定
  UPDATE chores
  SET partner_id = p_accepter_id
  WHERE owner_id = v_inviter_id AND partner_id IS NULL;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 8. Realtime Publication への追加
-- ==========================================

-- 注意: supabase_realtime は FOR ALL TABLES で定義されているため
-- 個別のテーブル追加は不要（自動的に含まれる）
-- ALTER PUBLICATION supabase_realtime ADD TABLE partner_invitations; -- 不要

-- REPLICA IDENTITY を FULL に設定
ALTER TABLE partner_invitations REPLICA IDENTITY FULL;

-- ==========================================
-- 9. 初期データ・テスト用関数
-- ==========================================

-- 招待コード生成関数
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
BEGIN
  -- UUID v4 から招待コードを生成（ハイフンを除去して短縮）
  RETURN REPLACE(gen_random_uuid()::TEXT, '-', '');
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 10. マイグレーション完了確認
-- ==========================================

-- マイグレーション実行確認用のコメント
COMMENT ON TABLE partner_invitations IS 'パートナー招待管理テーブル - Migration 001';
COMMENT ON COLUMN profiles.partner_id IS 'パートナーユーザーID - Migration 001';
COMMENT ON COLUMN profiles.partnership_created_at IS 'パートナー関係作成日時 - Migration 001';
COMMENT ON COLUMN chores.created_at IS '家事作成日時 - Migration 001';

-- マイグレーション完了ログ
DO $$
BEGIN
  RAISE NOTICE 'Migration 001: Partner invitation tables created successfully at %', NOW();
END
$$;