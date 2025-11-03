-- Realtime機能修正のためのデータベースマイグレーション
-- 作成日: 2025-01-20
-- 説明: completions と thanks テーブルの REPLICA IDENTITY を FULL に設定
--       Supabase Realtime が正常に動作するために必要

-- ==========================================
-- 1. REPLICA IDENTITY の修正
-- ==========================================

-- completions テーブルの REPLICA IDENTITY を FULL に設定
-- これによりSupabase Realtimeが変更を正しく検知できるようになる
ALTER TABLE public.completions REPLICA IDENTITY FULL;

-- thanks テーブルの REPLICA IDENTITY を FULL に設定
-- これによりSupabase Realtimeが変更を正しく検知できるようになる
ALTER TABLE public.thanks REPLICA IDENTITY FULL;

-- ==========================================
-- 2. 設定確認
-- ==========================================

-- 設定確認用のクエリ（実行後に確認可能）
-- SELECT n.nspname as schemaname, c.relname as tablename, c.relreplident 
-- FROM pg_class c
-- JOIN pg_namespace n ON c.relnamespace = n.oid 
-- WHERE n.nspname = 'public' 
-- AND c.relname IN ('chores', 'completions', 'thanks');

-- ==========================================
-- 3. マイグレーション完了確認
-- ==========================================

-- マイグレーション実行確認用のコメント
COMMENT ON TABLE completions IS 'REPLICA IDENTITY FULL設定済み - Migration 002';
COMMENT ON TABLE thanks IS 'REPLICA IDENTITY FULL設定済み - Migration 002';

-- マイグレーション完了ログ
DO $$
BEGIN
  RAISE NOTICE 'Migration 002: REPLICA IDENTITY FULL set for completions and thanks tables at %', NOW();
END
$$;