-- Remove old insert_chore_bypass_rls function without search_path setting
-- This migration removes the insecure version of the function
-- Created: 2025-01-20
-- Issue: Two versions of insert_chore_bypass_rls exist - one without search_path (insecure)

-- ==========================================
-- 1. 関数の詳細情報を確認（ログ用）
-- ==========================================

DO $$
DECLARE
    func_count INTEGER;
    func_record RECORD;
BEGIN
    -- 現在の関数数を確認
    SELECT COUNT(*) INTO func_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'insert_chore_bypass_rls'
      AND n.nspname = 'public';
    
    RAISE NOTICE 'Found % insert_chore_bypass_rls functions before cleanup', func_count;
    
    -- 各関数の詳細をログ出力
    FOR func_record IN
        SELECT 
            pg_get_function_identity_arguments(p.oid) as args,
            CASE 
                WHEN p.proconfig IS NULL THEN 'No search_path (INSECURE)'
                WHEN 'search_path=public' = ANY(p.proconfig) THEN 'search_path=public (SECURE)'
                ELSE 'Other search_path'
            END as security_status
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'insert_chore_bypass_rls'
          AND n.nspname = 'public'
    LOOP
        RAISE NOTICE 'Function: insert_chore_bypass_rls(%) - %', func_record.args, func_record.security_status;
    END LOOP;
END
$$;

-- ==========================================
-- 2. 古い関数（search_pathなし）を削除
-- ==========================================

-- 最初に、引数の順序が古い可能性のある関数を削除
-- (p_owner_id UUID, p_partner_id UUID DEFAULT NULL, p_title TEXT)
DROP FUNCTION IF EXISTS insert_chore_bypass_rls(UUID, UUID, TEXT);

-- 次に、引数の順序が新しいがsearch_pathが設定されていない関数を削除
-- (p_owner_id UUID, p_title TEXT, p_partner_id UUID DEFAULT NULL)
-- ただし、search_pathが設定されている関数は保持したいので、
-- より具体的なアプローチを使用

-- すべての古い関数を削除してから、セキュアな関数を再作成
DO $$
DECLARE
    func_oid OID;
BEGIN
    -- search_pathが設定されていない関数のOIDを取得して削除
    FOR func_oid IN
        SELECT p.oid
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'insert_chore_bypass_rls'
          AND n.nspname = 'public'
          AND p.proconfig IS NULL  -- search_pathが設定されていない関数のみ
    LOOP
        EXECUTE 'DROP FUNCTION ' || func_oid::regprocedure;
        RAISE NOTICE 'Dropped insecure function: %', func_oid::regprocedure;
    END LOOP;
END
$$;

-- ==========================================
-- 3. セキュアな関数が存在することを確認
-- ==========================================

DO $$
DECLARE
    secure_func_count INTEGER;
BEGIN
    -- search_path=publicが設定された関数の数を確認
    SELECT COUNT(*) INTO secure_func_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'insert_chore_bypass_rls'
      AND n.nspname = 'public'
      AND 'search_path=public' = ANY(p.proconfig);
    
    IF secure_func_count = 0 THEN
        RAISE EXCEPTION 'ERROR: No secure insert_chore_bypass_rls function found after cleanup!';
    ELSIF secure_func_count = 1 THEN
        RAISE NOTICE 'SUCCESS: Exactly 1 secure insert_chore_bypass_rls function exists';
    ELSE
        RAISE WARNING 'WARNING: % secure insert_chore_bypass_rls functions exist', secure_func_count;
    END IF;
END
$$;

-- ==========================================
-- 4. 最終確認とログ
-- ==========================================

DO $$
DECLARE
    final_count INTEGER;
    func_record RECORD;
BEGIN
    -- 最終的な関数数を確認
    SELECT COUNT(*) INTO final_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'insert_chore_bypass_rls'
      AND n.nspname = 'public';
    
    RAISE NOTICE 'Final count: % insert_chore_bypass_rls functions after cleanup', final_count;
    
    -- 残っている関数の詳細をログ出力
    FOR func_record IN
        SELECT 
            pg_get_function_identity_arguments(p.oid) as args,
            CASE 
                WHEN p.proconfig IS NULL THEN 'No search_path (INSECURE)'
                WHEN 'search_path=public' = ANY(p.proconfig) THEN 'search_path=public (SECURE)'
                ELSE 'Other search_path'
            END as security_status
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'insert_chore_bypass_rls'
          AND n.nspname = 'public'
    LOOP
        RAISE NOTICE 'Remaining function: insert_chore_bypass_rls(%) - %', func_record.args, func_record.security_status;
    END LOOP;
END
$$;

-- ==========================================
-- 5. マイグレーション完了確認
-- ==========================================

COMMENT ON SCHEMA public IS 'セキュリティ修正完了: insert_chore_bypass_rls古い関数削除 - Migration 20250120000003';

-- マイグレーション完了ログ
DO $$
BEGIN
    RAISE NOTICE 'Security Migration 20250120000003: Old insert_chore_bypass_rls function cleanup completed at %', NOW();
    RAISE NOTICE 'Removed insecure functions without search_path setting';
    RAISE NOTICE 'Secure function with search_path=public should remain';
END
$$;