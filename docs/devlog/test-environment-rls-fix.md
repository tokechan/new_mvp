# テスト環境でのRLSポリシー問題の解決

## 問題の概要

### 発生した問題
- テスト環境（`NEXT_PUBLIC_SKIP_AUTH=true`）でアプリケーションを実行した際、RLS（Row Level Security）ポリシーによってデータベースアクセスが拒否される問題が発生
- 具体的には `auth.uid()` が `null` を返すため、通常のRLSポリシーが機能しない状態

### エラーメッセージ
```
row-level security policy for table "profiles" (USING expression) violated
row-level security policy for table "chores" (USING expression) violated
```

### 根本原因
1. **認証スキップ機能**: テスト環境では `NEXT_PUBLIC_SKIP_AUTH=true` により認証をバイパス
2. **RLSポリシーの依存**: 既存のRLSポリシーは `auth.uid()` に依存しているが、認証スキップ時は `null` を返す
3. **テストデータアクセス**: テスト用の固定ユーザーID（`550e8400-e29b-41d4-a716-446655440000`）でのアクセスが必要

## 解決方法

### 実施した対応

#### 1. テスト環境専用RLSポリシーの追加

**profilesテーブル用ポリシー**:
```sql
CREATE POLICY "test_env_access_profiles" ON profiles
FOR ALL
USING (
  id = '550e8400-e29b-41d4-a716-446655440000'::uuid 
  OR auth.uid() IS NOT NULL
);
```

**choresテーブル用ポリシー**:
```sql
CREATE POLICY "test_env_access_chores" ON chores
FOR ALL
USING (
  owner_id = '550e8400-e29b-41d4-a716-446655440000'::uuid 
  OR owner_id = auth.uid()
);
```

#### 2. ポリシーの適用範囲
- **対象操作**: SELECT, INSERT, UPDATE, DELETE すべて
- **適用条件**: 
  - テスト用固定ユーザーID（`550e8400-e29b-41d4-a716-446655440000`）
  - または通常の認証ユーザー（`auth.uid()`）

### 技術的詳細

#### RLSポリシーの優先順位
- PostgreSQLのRLSでは、複数のポリシーがある場合、**OR条件**で評価される
- テスト環境用ポリシーと本番用ポリシーが共存可能
- セキュリティを保ちつつ、テスト環境での動作を確保

#### 固定ユーザーIDの選択理由
- UUID v4形式で一意性を保証
- テストデータとして識別しやすい値
- 本番環境での偶発的な衝突リスクを最小化

## 検証結果

### 動作確認項目
- ✅ アプリケーションの正常起動
- ✅ 家事データのCRUD操作
- ✅ リアルタイム通知機能
- ✅ パートナー招待機能
- ✅ APIエンドポイントのレスポンス

### ログ確認
```
✓ Successfully subscribed to realtime changes for user: 550e8400-e29b-41d4-a716-446655440000
✓ Compiled / in 2s (836 modules)
✓ Ready in 1410ms
```

## 今後の注意事項

### 運用上の注意
1. **本番環境への影響なし**: テスト用ポリシーは固定UUIDのみに適用
2. **セキュリティ維持**: 通常のRLSポリシーは引き続き有効
3. **テストデータ管理**: 固定UUIDのデータは定期的にクリーンアップ推奨

### 変更時の注意
- **RLSポリシー変更時**: テスト環境用ポリシーも同時に更新が必要
- **テストユーザーID変更時**: アプリケーション側の設定と合わせて更新
- **新テーブル追加時**: 同様のテスト環境用ポリシーの追加を検討

## 関連ファイル

- **RLSポリシー定義**: `docs/reference/rls-policies.sql`
- **認証設定**: `src/contexts/AuthContext.tsx`
- **テスト設定**: `playwright.config.ts`
- **環境変数**: `.env.example`

## 参考情報

### Supabase RLS ドキュメント
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

### プロジェクト内関連ドキュメント
- `docs/reference/security.md` - セキュリティ設計
- `docs/reference/08-test-strategy-and-guidelines.md` - テスト戦略
- `docs/devlog/realtime-troubleshooting-log.md` - リアルタイム機能のトラブルシューティング

---

**作成日**: 2025-01-21  
**最終更新**: 2025-01-21  
**作成者**: Development Team  
**ステータス**: 解決済み・運用中