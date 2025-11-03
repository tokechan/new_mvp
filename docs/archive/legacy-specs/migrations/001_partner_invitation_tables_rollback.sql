-- パートナー招待機能のロールバック用マイグレーション
-- 作成日: 2025-09-07
-- 説明: 001_partner_invitation_tables.sql の変更を元に戻す

-- ==========================================
-- 警告: このスクリプトはデータを削除します
-- 本番環境では十分注意して実行してください
-- ==========================================

-- ==========================================
-- 1. Realtime Publication から削除
-- ==========================================

-- 注意: supabase_realtime は FOR ALL TABLES で定義されているため
-- 個別のテーブル削除は不要（テーブル削除時に自動的に除外される）
-- ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS partner_invitations; -- 不要

-- ==========================================
-- 2. 関数の削除
-- ==========================================

-- パートナー連携処理関数を削除
DROP FUNCTION IF EXISTS link_partners(TEXT, UUID);

-- 招待コード生成関数を削除
DROP FUNCTION IF EXISTS generate_invite_code();

-- 期限切れ招待の自動削除関数を削除
DROP FUNCTION IF EXISTS cleanup_expired_invitations();

-- ==========================================
-- 3. RLSポリシーの削除
-- ==========================================

-- partner_invitations テーブルのポリシーを削除
DROP POLICY IF EXISTS "Users can view their own invitations" ON partner_invitations;
DROP POLICY IF EXISTS "Users can create invitations" ON partner_invitations;
DROP POLICY IF EXISTS "Users can update their own invitations" ON partner_invitations;
DROP POLICY IF EXISTS "Public can view valid invitations by code" ON partner_invitations;

-- profiles テーブルの新しいポリシーを削除
DROP POLICY IF EXISTS "Users can view own and partner profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- ==========================================
-- 4. インデックスの削除
-- ==========================================

-- partner_invitations テーブルのインデックスを削除
DROP INDEX IF EXISTS idx_partner_invitations_invite_code;
DROP INDEX IF EXISTS idx_partner_invitations_inviter_id;
DROP INDEX IF EXISTS idx_partner_invitations_status;
DROP INDEX IF EXISTS idx_partner_invitations_expires_at;

-- profiles テーブルの新しいインデックスを削除
DROP INDEX IF EXISTS idx_profiles_partner_id;

-- chores テーブルの新しいインデックスを削除
DROP INDEX IF EXISTS idx_chores_created_at;

-- ==========================================
-- 5. テーブル構造の変更を元に戻す
-- ==========================================

-- chores テーブルからcreated_atカラムを削除
-- 注意: このカラムにデータがある場合は削除されます
ALTER TABLE chores DROP COLUMN IF EXISTS created_at;

-- profiles テーブルからパートナー関連カラムを削除
-- 注意: パートナー関係のデータは失われます
ALTER TABLE profiles DROP COLUMN IF EXISTS partnership_created_at;
ALTER TABLE profiles DROP COLUMN IF EXISTS partner_id;

-- ==========================================
-- 6. partner_invitations テーブルの削除
-- ==========================================

-- RLSを無効化してからテーブルを削除
ALTER TABLE partner_invitations DISABLE ROW LEVEL SECURITY;

-- テーブル全体を削除
-- 注意: すべての招待データが失われます
DROP TABLE IF EXISTS partner_invitations;

-- ==========================================
-- 7. 既存のchoresテーブルのpartner_idをNULLに設定
-- ==========================================

-- 既存の家事データのpartner_idをクリア
-- 注意: パートナーとの共有情報が失われます
UPDATE chores SET partner_id = NULL WHERE partner_id IS NOT NULL;

-- ==========================================
-- 8. ロールバック完了確認
-- ==========================================

-- ロールバック完了ログ
DO $$
BEGIN
  RAISE NOTICE 'Rollback 001: Partner invitation tables removed successfully at %', NOW();
  RAISE WARNING 'All partner relationships and invitation data have been permanently deleted';
END
$$;

-- ==========================================
-- 9. 確認用クエリ
-- ==========================================

-- ロールバック後の状態確認
-- 以下のクエリでテーブルとカラムが削除されていることを確認

/*
-- partner_invitations テーブルが存在しないことを確認
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'partner_invitations';

-- profiles テーブルからパートナー関連カラムが削除されていることを確認
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name IN ('partner_id', 'partnership_created_at');

-- chores テーブルからcreated_atカラムが削除されていることを確認
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'chores' 
  AND column_name = 'created_at';
*/