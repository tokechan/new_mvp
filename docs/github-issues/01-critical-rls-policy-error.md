# 🚨 [Critical] RLSポリシーエラーの解決 - 家事追加機能が動作しない

## 問題の概要

現在、家事追加機能でRLS（Row Level Security）ポリシーエラーが発生し、新しい家事を追加できない状態です。

## エラー詳細

```
PostgresError: new row violates row-level security policy for table "chores"
```

## 原因分析

1. **プロフィール未作成**: 新規ユーザーのプロフィールが自動作成されていない
2. **RLSポリシー**: `chores_insert_owner_only` ポリシーが `owner_id = auth.uid()` をチェックしているが、対応するプロフィールが存在しない
3. **認証フロー**: Google OAuth後のプロフィール作成処理が不完全

## 解決策

### Phase 1: 緊急対応
- [ ] 現在のエラー状況を再確認
- [ ] ブラウザのコンソールでエラーメッセージを確認
- [ ] Supabaseダッシュボードでテーブル状況を確認

### Phase 2: 根本解決
- [ ] AuthContextにプロフィール自動作成機能を追加
- [ ] RLSポリシーを修正（必要に応じて）
- [ ] エラーハンドリングを改善

### Phase 3: テスト・検証
- [ ] 新規ユーザー登録でプロフィール作成を確認
- [ ] 家事追加機能の動作確認
- [ ] RLSポリシーの動作確認

## 技術的詳細

### 現在のRLSポリシー
```sql
CREATE POLICY "chores_insert_owner_only"
ON public.chores FOR INSERT
WITH CHECK (owner_id = auth.uid());
```

### 必要なプロフィール作成処理
```sql
INSERT INTO profiles (id, display_name)
VALUES (auth.uid(), 'ユーザー名');
```

## 優先度

**Critical** - アプリの基本機能が動作しないため最優先で対応が必要

## 関連ファイル

- `src/contexts/AuthContext.tsx`
- `src/components/ChoresList.tsx`
- `docs/reference/rls-policies.sql`
- `docs/reference/current-issues-and-solutions.md`

## 参考資料

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

## ラベル

`bug`, `critical`, `rls`, `authentication`

---

**作成日**: 2024年12月
**担当者**: 未割り当て
**マイルストーン**: MVP リリース前