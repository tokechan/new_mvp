# 💝 ありがとう機能の実装

## 機能概要

完了した家事に対してパートナーが感謝メッセージを送信できる機能を実装する。

## 要件

### 基本機能
- [ ] 完了した家事に「ありがとう」ボタンを表示
- [ ] 感謝メッセージの入力フォーム
- [ ] 感謝メッセージの送信と保存
- [ ] 感謝メッセージの表示
- [ ] リアルタイム通知機能

### データベース設計
- [ ] `thank_you_messages` テーブルの作成
- [ ] 適切なRLSポリシーの設定
- [ ] インデックスの最適化

### UI/UX
- [ ] 感謝メッセージフォームのモーダル表示
- [ ] 送信済み感謝メッセージの表示
- [ ] 通知センターでの感謝メッセージ表示
- [ ] アニメーションとフィードバック

## 技術的詳細

### データベーススキーマ
```sql
-- 感謝メッセージテーブル
CREATE TABLE thank_you_messages (
  id BIGSERIAL PRIMARY KEY,
  chore_id BIGINT REFERENCES chores(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id),
  receiver_id UUID REFERENCES profiles(id),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_thank_you_messages_chore_id ON thank_you_messages(chore_id);
CREATE INDEX idx_thank_you_messages_receiver_id ON thank_you_messages(receiver_id);
CREATE INDEX idx_thank_you_messages_created_at ON thank_you_messages(created_at);
```

### RLSポリシー
```sql
-- 感謝メッセージの挿入ポリシー
CREATE POLICY "thank_you_messages_insert_partner_only"
ON public.thank_you_messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM chores 
    WHERE id = chore_id 
    AND (owner_id = auth.uid() OR partner_id = auth.uid())
    AND done = true
  )
);

-- 感謝メッセージの閲覧ポリシー
CREATE POLICY "thank_you_messages_select_involved_users"
ON public.thank_you_messages FOR SELECT
USING (sender_id = auth.uid() OR receiver_id = auth.uid());
```

### API設計
```typescript
// 感謝メッセージの送信
const sendThankYouMessage = async (choreId: number, message: string) => {
  const { data, error } = await supabase
    .from('thank_you_messages')
    .insert({
      chore_id: choreId,
      sender_id: user.id,
      receiver_id: chore.owner_id, // または partner_id
      message
    })
    .select();
  
  if (error) throw error;
  return data;
};

// 感謝メッセージの取得
const getThankYouMessages = async (choreId: number) => {
  const { data, error } = await supabase
    .from('thank_you_messages')
    .select(`
      *,
      sender:profiles!sender_id(display_name),
      receiver:profiles!receiver_id(display_name)
    `)
    .eq('chore_id', choreId)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return data;
};
```

## 実装ファイル

### 修正が必要なファイル
- `src/components/ChoreItem.tsx` - ありがとうボタンの追加
- `src/components/ThankYouMessage.tsx` - 感謝メッセージコンポーネントの拡張
- `src/components/NotificationCenter.tsx` - 感謝メッセージ通知の追加
- `src/hooks/useChores.ts` - 感謝メッセージ関連のロジック追加

### 新規作成が必要なファイル
- `src/hooks/useThankYouMessages.ts` - 感謝メッセージ管理フック
- `src/services/thankYouService.ts` - 感謝メッセージAPI
- `src/components/ThankYouModal.tsx` - 感謝メッセージ入力モーダル

## リアルタイム機能

### Supabase Realtime設定
```typescript
// 感謝メッセージのリアルタイム購読
const subscribeToThankYouMessages = () => {
  return supabase
    .channel('thank_you_messages')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'thank_you_messages',
        filter: `receiver_id=eq.${user.id}`
      },
      (payload) => {
        // 新しい感謝メッセージの通知
        showNotification(payload.new);
      }
    )
    .subscribe();
};
```

## テスト要件

### E2Eテスト
- [ ] 完了した家事にありがとうボタンが表示される
- [ ] 感謝メッセージフォームの表示と送信
- [ ] 感謝メッセージの表示確認
- [ ] リアルタイム通知の確認
- [ ] 権限チェック（パートナーのみ送信可能）

### 既存テストファイル
- `tests/e2e/thank-you-feature.spec.ts` - 既存テストの拡張

## 依存関係

### 前提条件
- Issue #1: RLSポリシーエラーの解決
- Issue #2: 家事完了機能の実装
- パートナー連携機能が動作していること

### 後続タスク
- Issue #4: リアルタイム機能の最適化
- Issue #5: 通知機能の拡張

## 優先度

**High** - MVP の差別化要因となる重要機能

## 見積もり

**工数**: 2-3日
**複雑度**: High（データベース設計、リアルタイム機能、UI実装）

## 受け入れ基準

- [ ] 完了した家事に対してありがとうメッセージを送信できる
- [ ] 感謝メッセージがリアルタイムで通知される
- [ ] 感謝メッセージが適切に表示される
- [ ] 権限チェックが正しく動作する
- [ ] E2Eテストが通る
- [ ] パフォーマンスが要件を満たす

## UI/UXデザイン要件

- [ ] 感謝メッセージフォームは使いやすいモーダル形式
- [ ] 送信時のローディング状態を表示
- [ ] 成功時のフィードバックアニメーション
- [ ] 感謝メッセージは家事アイテムに関連付けて表示
- [ ] 通知センターでの見やすい表示

## ラベル

`feature`, `high-priority`, `mvp`, `realtime`, `ui`, `database`

---

**作成日**: 2024年12月
**担当者**: 未割り当て
**マイルストーン**: MVP リリース前