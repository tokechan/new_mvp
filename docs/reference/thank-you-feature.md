# 感謝機能 (Thank You Feature)

## 概要

家事完了時にパートナーに感謝メッセージを送信できる機能です。リアルタイム通知と履歴表示により、パートナー間のコミュニケーションを促進します。

## 機能詳細

### 1. 感謝メッセージ送信

- **場所**: `/thank-you?choreId={id}` ページ
- **トリガー**: 家事完了後の「ありがとう」ボタン
- **機能**:
  - カスタムメッセージ入力
  - 定型メッセージ選択
  - メッセージ送信
  - 成功/エラー通知

### 2. 感謝履歴表示

- **場所**: `/thank-you/history` ページ
- **機能**:
  - 送受信した感謝メッセージの一覧表示
  - 日時順ソート
  - メッセージ方向の視覚的区別
  - 関連家事情報の表示

### 3. リアルタイム通知

- **機能**:
  - 感謝メッセージ受信時の即座通知
  - Supabase Realtime使用
  - 通知センターでの表示

## 技術実装

### データベース構造

```sql
-- thanks テーブル
CREATE TABLE thanks (
  id BIGSERIAL PRIMARY KEY,
  from_user_id UUID REFERENCES auth.users(id),
  to_user_id UUID REFERENCES auth.users(id),
  chore_id BIGINT REFERENCES chores(id),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_thanks_to_user_created ON thanks(to_user_id, created_at DESC);
CREATE INDEX idx_thanks_chore_id ON thanks(chore_id);
```

### RLSポリシー

```sql
-- 閲覧: 送信者または受信者のみ
CREATE POLICY "Users can view their own thank you messages" ON thanks
  FOR SELECT USING (
    from_user_id = auth.uid() OR to_user_id = auth.uid()
  );

-- 挿入: 認証済みユーザーのみ
CREATE POLICY "Authenticated users can send thank you messages" ON thanks
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    from_user_id = auth.uid()
  );
```

### コンポーネント構成

#### ThankYouMessage.tsx
- 感謝メッセージ送信フォーム
- 定型メッセージ選択
- バリデーション
- 送信処理

#### ThankYouHistory.tsx
- 感謝履歴一覧表示
- メッセージ方向の視覚的区別
- 日時フォーマット
- 空状態・エラー状態の処理

#### useThankYouRealtime.ts
- リアルタイム感謝通知
- Supabase Realtime購読
- 通知センター連携

### サービス層

#### thankYouService.ts
- `sendThankYou()`: 感謝メッセージ送信
- `sendThankYouForChore()`: 家事に対する感謝送信
- `getThankYouHistory()`: 感謝履歴取得
- 定型メッセージ管理

## アクセシビリティ対応

### キーボードナビゲーション
- Tabキーでのフォーカス移動
- Enterキーでの送信
- Escapeキーでのモーダル閉じる

### スクリーンリーダー対応
- 適切なARIA属性
- フォームラベル
- エラーメッセージのaria-live
- 成功通知のrole="alert"

### 視覚的配慮
- 高コントラスト対応
- フォーカス表示
- メッセージ方向の色分け

## パフォーマンス

### 最適化
- 履歴の遅延読み込み
- Realtime購読の適切なフィルタリング
- メッセージキャッシュ

### 監視指標
- メッセージ送信成功率
- Realtime通知遅延
- 履歴読み込み時間

## テスト

### E2Eテスト (thank-you.spec.ts)
- 感謝メッセージ送信
- 定型メッセージ選択
- 空メッセージバリデーション
- 感謝履歴表示
- キーボードナビゲーション
- アクセシビリティ
- レスポンシブデザイン

### ユニットテスト
- thankYouService関数
- useThankYouRealtimeフック
- コンポーネントレンダリング

## セキュリティ

### 認証・認可
- JWT認証必須
- RLSによる行レベルセキュリティ
- パートナー関係の検証

### 入力検証
- メッセージ長制限
- XSS対策（エスケープ処理）
- SQLインジェクション対策（パラメータ化クエリ）

## 運用

### 監視
- 感謝メッセージ送信数
- エラー率
- Realtime接続状況

### メンテナンス
- 古い感謝メッセージのアーカイブ
- パフォーマンス監視
- ユーザーフィードバック収集

## 今後の拡張

### Phase 2候補
- 感謝メッセージのリアクション機能
- 感謝統計・レポート
- 感謝メッセージのカテゴリ分類
- 画像・絵文字添付
- 感謝ポイントシステム

### 技術的改善
- BFF経由でのAPI統合
- プッシュ通知対応
- オフライン対応
- メッセージ検索機能