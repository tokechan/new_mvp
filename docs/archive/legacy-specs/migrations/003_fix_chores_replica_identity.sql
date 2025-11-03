-- choresテーブルのREPLICA IDENTITY修正のためのマイグレーション
-- 作成日: 2025-01-20
-- 説明: chores テーブルの REPLICA IDENTITY を FULL に設定
--       Supabase Realtime の DELETE イベントが正常に動作するために必要

-- ==========================================
-- 1. 現在の設定確認
-- ==========================================

-- 現在の REPLICA IDENTITY 設定を確認
-- 'f' = FULL, 'd' = DEFAULT, 'n' = NOTHING, 'i' = INDEX
SELECT 
    schemaname, 
    tablename, 
    CASE 
        WHEN relreplident = 'f' THEN 'FULL'
        WHEN relreplident = 'd' THEN 'DEFAULT' 
        WHEN relreplident = 'n' THEN 'NOTHING'
        WHEN relreplident = 'i' THEN 'INDEX'
        ELSE 'UNKNOWN'
    END as replica_identity
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid 
JOIN pg_tables t ON t.tablename = c.relname AND t.schemaname = n.nspname
WHERE n.nspname = 'public' 
AND c.relname = 'chores';

-- ==========================================
-- 2. REPLICA IDENTITY の修正
-- ==========================================

-- chores テーブルの REPLICA IDENTITY を FULL に設定
-- これによりSupabase Realtime の DELETE イベントが正常に動作する
ALTER TABLE public.chores REPLICA IDENTITY FULL;

-- ==========================================
-- 3. 設定確認
-- ==========================================

-- 設定後の確認
SELECT 
    schemaname, 
    tablename, 
    CASE 
        WHEN relreplident = 'f' THEN 'FULL'
        WHEN relreplident = 'd' THEN 'DEFAULT' 
        WHEN relreplident = 'n' THEN 'NOTHING'
        WHEN relreplident = 'i' THEN 'INDEX'
        ELSE 'UNKNOWN'
    END as replica_identity
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid 
JOIN pg_tables t ON t.tablename = c.relname AND t.schemaname = n.nspname
WHERE n.nspname = 'public' 
AND c.relname IN ('chores', 'completions', 'thanks')
ORDER BY tablename;

-- ==========================================
-- 4. マイグレーション完了確認
-- ==========================================

-- マイグレーション実行確認用のコメント
COMMENT ON TABLE chores IS 'REPLICA IDENTITY FULL設定済み - Migration 003';

-- 完了ログ
DO $$
BEGIN
    RAISE NOTICE 'Migration 003: REPLICA IDENTITY FULL set for chores table at %', NOW();
END $$;