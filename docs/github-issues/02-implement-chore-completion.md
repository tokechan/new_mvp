# ✅ 家事完了機能の実装

## 機能概要

家事リストで各家事アイテムの完了状態を切り替える機能を実装する。

## 要件

### 基本機能
- [ ] 家事アイテムにチェックボックスまたは完了ボタンを追加
- [ ] 完了状態の切り替え（未完了 ↔ 完了）
- [ ] 完了状態のリアルタイム同期
- [ ] 完了した家事の視覚的な区別（グレーアウト、取り消し線など）

### データベース操作
- [ ] `chores` テーブルの `done` フィールドを更新
- [ ] 適切なRLSポリシーの確認
- [ ] エラーハンドリングの実装

### UI/UX
- [ ] 完了状態の明確な視覚的フィードバック
- [ ] ローディング状態の表示
- [ ] 操作の取り消し機能（オプション）

## 技術的詳細

### データベーススキーマ
```sql
-- chores テーブル（既存）
CREATE TABLE chores (
  id BIGSERIAL PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id),
  partner_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  done BOOLEAN DEFAULT FALSE,  -- この フィールドを使用
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 必要なRLSポリシー
```sql
-- 家事の更新ポリシー
CREATE POLICY "chores_update_owner_partner"
ON public.chores FOR UPDATE
USING (owner_id = auth.uid() OR partner_id = auth.uid())
WITH CHECK (owner_id = auth.uid() OR partner_id = auth.uid());
```

### API設計
```typescript
// 家事完了状態の更新
const toggleChoreCompletion = async (choreId: number, done: boolean) => {
  const { data, error } = await supabase
    .from('chores')
    .update({ done })
    .eq('id', choreId)
    .select();
  
  if (error) throw error;
  return data;
};
```

## 実装ファイル

### 修正が必要なファイル
- `src/components/ChoreItem.tsx` - 完了ボタンの追加
- `src/components/ChoresList.tsx` - 完了状態の管理
- `src/hooks/useChores.ts` - 完了状態更新のロジック
- `src/services/choreService.ts` - API呼び出し

### 新規作成が必要なファイル
- なし（既存ファイルの拡張）

## テスト要件

### E2Eテスト
- [ ] 家事の完了状態切り替えテスト
- [ ] 完了した家事の表示確認
- [ ] リアルタイム同期の確認
- [ ] エラーケースのテスト

### 既存テストファイル
- `tests/e2e/chores-management.spec.ts` - 既存テストに追加

## 依存関係

### 前提条件
- Issue #1: RLSポリシーエラーの解決が完了していること
- 基本的な家事追加機能が動作していること

### 後続タスク
- Issue #3: ありがとう機能の実装（完了した家事に対する感謝メッセージ）

## 優先度

**High** - MVP の核心機能の一つ

## 見積もり

**工数**: 1-2日
**複雑度**: Medium

## 受け入れ基準

- [ ] 家事アイテムの完了状態を切り替えできる
- [ ] 完了状態がリアルタイムで同期される
- [ ] 完了した家事が視覚的に区別される
- [ ] E2Eテストが通る
- [ ] エラーハンドリングが適切に動作する

## ラベル

`feature`, `high-priority`, `mvp`, `ui`, `database`

---

**作成日**: 2024年12月
**担当者**: 未割り当て
**マイルストーン**: MVP リリース前