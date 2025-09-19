# データベースマイグレーション実行ガイド

## 概要

Supabase を使用したデータベースマイグレーションの実行手順とベストプラクティス。

## 📋 マイグレーション一覧

| ID | ファイル名 | 説明 | 作成日 | ステータス |
|----|-----------|------|--------|----------|
| 001 | `001_partner_invitation_tables.sql` | パートナー招待機能のテーブル作成 | 2025-09-07 | 未実行 |
| 001R | `001_partner_invitation_tables_rollback.sql` | 001のロールバック用 | 2025-09-07 | - |

## 🚀 マイグレーション実行手順

### 前提条件

- Supabase プロジェクトへのアクセス権限
- データベースの管理者権限
- 本番環境の場合はバックアップ取得済み

### 実行方法

#### 方法1: Supabase Dashboard (推奨)

1. **Supabase Dashboard にアクセス**
   - プロジェクトの Database → SQL Editor を開く

2. **マイグレーションファイルを実行**
   ```sql
   -- 001_partner_invitation_tables.sql の内容をコピー&ペースト
   -- 「Run」ボタンをクリック
   ```

3. **実行結果を確認**
   - エラーがないことを確認
   - 「Migration 001: Partner invitation tables created successfully」メッセージを確認

#### 方法2: psql コマンドライン

```bash
# Supabase プロジェクトに接続
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# マイグレーションファイルを実行
\i docs/reference/migrations/001_partner_invitation_tables.sql

# 実行結果を確認
\dt partner_invitations
\d+ profiles
```

#### 方法3: Supabase CLI

```bash
# Supabase CLI でマイグレーション実行
supabase db push

# または直接SQLファイルを実行
supabase db reset --linked
```

## ✅ 実行後の確認事項

### 1. テーブル作成確認

```sql
-- partner_invitations テーブルが作成されていることを確認
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'partner_invitations';

-- profiles テーブルに新しいカラムが追加されていることを確認
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name IN ('partner_id', 'partnership_created_at');

-- chores テーブルにcreated_atカラムが追加されていることを確認
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'chores' 
  AND column_name = 'created_at';
```

### 2. インデックス作成確認

```sql
-- インデックスが作成されていることを確認
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE '%partner%';
```

### 3. RLS ポリシー確認

```sql
-- RLS ポリシーが設定されていることを確認
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('partner_invitations', 'profiles');
```

### 4. 関数作成確認

```sql
-- 作成された関数を確認
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'cleanup_expired_invitations',
    'link_partners',
    'generate_invite_code'
  );
```

### 5. Realtime Publication 確認

```sql
-- partner_invitations がRealtime Publicationに追加されていることを確認
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
  AND tablename = 'partner_invitations';
```

## 🔄 ロールバック手順

### 緊急時のロールバック

```sql
-- ロールバック用スクリプトを実行
-- 注意: データが失われる可能性があります
\i docs/reference/migrations/001_partner_invitation_tables_rollback.sql
```

### ロールバック後の確認

```sql
-- partner_invitations テーブルが削除されていることを確認
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
```

## 🛡️ セキュリティ考慮事項

### 本番環境での実行前チェックリスト

- [ ] **バックアップ取得**: 完全なデータベースバックアップを取得
- [ ] **ステージング環境でのテスト**: 本番と同じ環境でマイグレーションをテスト
- [ ] **ダウンタイム計画**: 必要に応じてメンテナンス時間を設定
- [ ] **ロールバック計画**: 問題発生時の復旧手順を準備
- [ ] **監視体制**: マイグレーション実行中の監視体制を整備

### 権限確認

```sql
-- 現在のユーザーの権限を確認
SELECT current_user, session_user;

-- テーブル作成権限があることを確認
SELECT has_database_privilege(current_user, current_database(), 'CREATE');
```

## 📊 パフォーマンス考慮事項

### 大量データがある場合の注意点

1. **chores テーブルの created_at カラム追加**
   - 既存レコードが多い場合は時間がかかる可能性
   - 必要に応じてバッチ処理で実行

2. **インデックス作成**
   - 大量データがある場合はCONCURRENTLYオプションを検討
   ```sql
   CREATE INDEX CONCURRENTLY idx_partner_invitations_invite_code 
   ON partner_invitations(invite_code);
   ```

## 🐛 トラブルシューティング

### よくあるエラーと対処法

#### 1. 権限エラー
```
ERROR: permission denied for schema public
```
**対処法**: データベース管理者権限で実行

#### 2. テーブル既存エラー
```
ERROR: relation "partner_invitations" already exists
```
**対処法**: `IF NOT EXISTS` が使用されているため通常は発生しない。手動で削除が必要な場合は先にロールバックスクリプトを実行

#### 3. 外部キー制約エラー
```
ERROR: insert or update on table violates foreign key constraint
```
**対処法**: 参照先テーブル（profiles）にデータが存在することを確認

### ログ確認

```sql
-- PostgreSQL ログを確認
SELECT * FROM pg_stat_activity WHERE state = 'active';

-- 最近のエラーログを確認（Supabase Dashboard の Logs タブ）
```

## 📝 マイグレーション記録

### 実行記録テンプレート

```
実行日時: YYYY-MM-DD HH:MM:SS
実行者: [名前]
環境: [development/staging/production]
マイグレーション: 001_partner_invitation_tables.sql
実行時間: [X分Y秒]
結果: [成功/失敗]
備考: [特記事項]
```

### 次回マイグレーション時の参考情報

- 実行時間の目安
- 発生した問題と解決方法
- パフォーマンスへの影響
- ユーザーへの影響

---

**重要**: 本番環境でのマイグレーション実行前は、必ずステージング環境での十分なテストを実施してください。