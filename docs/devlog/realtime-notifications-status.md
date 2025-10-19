# リアルタイム通知（家事完了/ありがとう） 現状ステータス

最終更新: 2025-10-17（このファイルは参照用の記録です。機能変更は行いません）

## 概要
- クライアントは `src/contexts/NotificationContext.tsx` で Supabase Realtime を購読
- 購読対象テーブル: `chores`, `completions`, `thanks`
- Supabase クライアントは `useMemo` 化され、再レンダーによる複数接続を防止
- 各チャネルは `on('postgres_changes', ...)` でイベントを受信し、フィルタ後に通知キューへ追加
- `completions` のチャネルはアンマウント時に `unsubscribe/cleanup` 済み

## 動作仕様（通知の表示条件）
- 「家事が完了しました」: パートナーが完了したイベントのみ表示（自分の完了は通知しない）
- 「ありがとうメッセージ」: 受信側（to_id = 自分）の INSERT/UPDATE を対象
- 「家事更新」: `chores` の UPDATE を必要に応じて処理（REPLICA IDENTITY FULL 前提）

## RLS / Publication / 依存設定
- RLS: `docs/reference/rls-policies.sql` に定義
  - `completions_insert_self`: `WITH CHECK (user_id = auth.uid())` により、本人以外の `user_id` での INSERT は `authenticated` ロールでは不可
  - Realtime WAL イベントは RLS 非依存だが、詳細取得の `select` は RLS に依存
- Publication: `supabase_realtime` に `public.thanks` と各対象テーブルが含まれることを確認済み
- REPLICA IDENTITY: `chores` は `FULL` 設定（UPDATE の old/new 比較が可能）

## デバッグ／ログ
- チャンネル状態: ブラウザコンソールに `completions channel status: SUBSCRIBED` が一度だけ出る想定
- 受信ペイロード: `[DEBUG] completions insert payload: ...` を追加済み（開発時の確認用）
- ありがとう詳細取得: FK エイリアスの修正済み（JOIN 名の不一致を解消）

## 期待される確認結果
1. 自分の `auth.uid()` で `INSERT INTO public.completions (chore_id, user_id) VALUES (..., '<self_uuid>')` を実行
   - Realtime 受信ログは出るが、UI通知は出ない（仕様通り）
2. パートナーの `uuid` で挿入（`service_role` またはパートナーとしてログイン）
   - 受信ログ + UI に「家事が完了しました」が表示

## 既知の制約 / 注意点
- 詳細表示に必要な `chore` 行が RLS で閲覧不可のとき、通知文にタイトルが出ず「不明」になる可能性あり
- 不要な再購読防止のため、効果フック依存配列から `supabase` を除外済み（メモ化により安全）
- マルチタブ動作時は各タブで購読されるため、通知表示はタブ単位となる

## トラブルシューティングの要点
- 通知が出ない: チャンネル状態 `SUBSCRIBED` を確認、フィルタ条件（自分/相手）を再チェック
- 受信はするが詳細が空: RLS で `chores` 行が読めるかを確認
- Publication 不足: Supabase ダッシュボードで `supabase_realtime` に対象テーブルが含まれるか確認

## 簡易テストの手順（手動）
- ブラウザで通知センターを開き、`SUBSCRIBED` ログが一度だけ出ることを確認
- SQL エディタで `INSERT` を行い、想定した通知が表示されるか確認

---
この文書は現状の把握と再現手順の共有を目的としたものです。変更は加えず、状態の記録のみを行っています。