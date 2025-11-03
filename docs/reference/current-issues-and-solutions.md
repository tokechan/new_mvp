# 現在の問題と解決策

## 📅 作成日時
2025年9月3日 - 開発中断時点での状況記録

## 🎯 プロジェクト進捗状況

### ✅ 完了済み項目
- [x] データベーステーブル作成（profiles, chores, completions, thanks）
- [x] RLSポリシー設定
- [x] ChoresListコンポーネントの新スキーマ対応
- [x] 基本的な認証システム

### 🔄 進行中項目
- [ ] ChoresListコンポーネントの動作確認
- [ ] RLSポリシーエラーの解決

### ⏳ 未着手項目
- [ ] 家事作成機能の完全実装
- [ ] 家事完了機能の実装
- [ ] 感謝メッセージ機能
- [ ] Realtime機能

## 🚨 現在発生している問題

### 問題1: RLSポリシーエラー

**エラー内容:**
```
code: 42501
message: new row violates row-level security policy for table "chores"
```

**発生箇所:**
- ChoresListコンポーネントの家事追加機能
- `addChore`関数実行時

**原因分析:**
1. **スキーマ不整合**: RLSポリシーが`auth.users`を参照しているが、実際のテーブルは`profiles`を参照
2. **プロフィール未作成**: ユーザーログイン時に`profiles`テーブルにレコードが自動作成されていない
3. **型の不一致**: `auth.uid()`と`owner_id`の参照関係が正しく設定されていない

## 🛠️ 解決策

### 解決策1: プロフィール自動作成機能の実装（推奨）

**実装場所:** `src/contexts/AuthContext.tsx`

```typescript
// ユーザーログイン時にプロフィールを自動作成
const createProfile = async (user: User) => {
  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      display_name: user.email?.split('@')[0] || 'ユーザー'
    })
  
  if (error) console.error('プロフィール作成エラー:', error)
}
```

### 解決策2: RLSポリシーの修正

**実行場所:** Supabase SQL Editor

```sql
-- 既存のポリシーを削除
DROP POLICY IF EXISTS "chores_insert_owner_only" ON public.chores;

-- 新しいポリシーを作成
CREATE POLICY "chores_insert_owner_only"
ON public.chores FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = chores.owner_id 
    AND profiles.id = auth.uid()
  )
);
```

### 解決策3: エラーハンドリングの改善

**実装場所:** `src/features/chores/components/ChoresList.tsx`

```typescript
// より詳細なエラーハンドリング
try {
  // 家事作成処理
} catch (error) {
  console.error('家事の追加に失敗しました:', error)
  // ユーザーフレンドリーなエラーメッセージ表示
  alert('家事の追加に失敗しました。プロフィール設定を確認してください。')
}
```

## 📋 作業再開時のチェックリスト

### Step 1: 問題の確認
- [ ] 現在のエラー状況を再確認
- [ ] ブラウザのコンソールでエラーメッセージを確認
- [ ] Supabaseダッシュボードでテーブル状況を確認

### Step 2: 解決策の実装
- [ ] AuthContextにプロフィール自動作成機能を追加
- [ ] RLSポリシーを修正（必要に応じて）
- [ ] エラーハンドリングを改善

### Step 3: テスト・検証
- [ ] 新規ユーザー登録でプロフィール作成を確認
- [ ] 家事追加機能の動作確認
- [ ] RLSポリシーの動作確認

### Step 4: 次の機能実装
- [ ] 家事完了機能の実装
- [ ] 感謝メッセージ機能の実装
- [ ] Realtime機能の追加

## 🔧 技術的詳細

### データベーススキーマ
```sql
-- profiles テーブル
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- chores テーブル
CREATE TABLE chores (
  id BIGSERIAL PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id),
  partner_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  done BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 現在のRLSポリシー
```sql
-- chores テーブルのINSERTポリシー
CREATE POLICY "chores_insert_owner_only"
ON public.chores FOR INSERT
WITH CHECK (owner_id = auth.uid());
```

## 📞 緊急時の対応

### 一時的な解決策（開発環境のみ）
```sql
-- RLSを一時的に無効化
ALTER TABLE public.chores DISABLE ROW LEVEL SECURITY;
```

⚠️ **警告**: 本番環境では絶対に使用しないこと

## 📚 参考資料

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- プロジェクト内の`docs/rls-policies.sql`
- プロジェクト内の`docs/erd.md`

## 💡 今後の改善点

1. **プロフィール管理機能の充実**
   - プロフィール編集機能
   - アバター画像アップロード
   - パートナー招待機能

2. **エラーハンドリングの強化**
   - ユーザーフレンドリーなエラーメッセージ
   - リトライ機能
   - オフライン対応

3. **パフォーマンス最適化**
   - データベースインデックスの最適化
   - キャッシュ戦略の実装
   - リアルタイム更新の効率化

---

**作業再開時は、このドキュメントを参照して現在の状況を把握し、Step 1から順番に進めてください。**