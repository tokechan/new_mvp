-- thanksテーブルにchore_idフィールドを追加するマイグレーション
-- 作成日: 2025-01-20
-- 説明: ありがとうメッセージを特定の家事に関連付けるため、thanksテーブルにchore_idフィールドを追加

-- ==========================================
-- 1. thanksテーブルにchore_idカラムを追加
-- ==========================================

-- chore_idカラムを追加（NULL許可、後で外部キー制約を追加）
ALTER TABLE public.thanks 
ADD COLUMN chore_id bigint;

-- ==========================================
-- 2. 外部キー制約を追加
-- ==========================================

-- chore_idに対する外部キー制約を追加
ALTER TABLE public.thanks 
ADD CONSTRAINT thanks_chore_id_fkey 
FOREIGN KEY (chore_id) REFERENCES public.chores(id) ON DELETE CASCADE;

-- ==========================================
-- 3. インデックスを追加（パフォーマンス向上）
-- ==========================================

-- chore_idに対するインデックスを作成
CREATE INDEX idx_thanks_chore_id ON public.thanks(chore_id);

-- ==========================================
-- 4. RLSポリシーの更新（必要に応じて）
-- ==========================================

-- 既存のRLSポリシーがchore_idを考慮するように更新が必要な場合は、
-- 別途RLSポリシーの見直しを行う

-- ==========================================
-- 5. マイグレーション完了確認
-- ==========================================

-- マイグレーション実行確認用のコメント
COMMENT ON COLUMN thanks.chore_id IS 'Migration 003で追加 - 家事IDへの参照';

-- マイグレーション完了ログ
DO $$
BEGIN
  RAISE NOTICE 'Migration 003: chore_id column added to thanks table at %', NOW();
END
$$;