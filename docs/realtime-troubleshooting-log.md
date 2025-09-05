# Realtime 配信トラブルシューティング記録（ThankYou Chores）

作成日: 2025-09-08

## 背景 / 目的
- 目的: Supabase Realtime で `public.chores`（必要に応じて `public.completions` / `public.thanks`）の INSERT/UPDATE/DELETE をクライアント間で即時同期させる。
- 症状: ブラウザの複数タブで同一ユーザーを開いても、操作（追加/更新/削除）が相互にリアルタイム反映されない。

## 現状の確認結果（本日時点）
- Publication 状態
  - `supabase_realtime` に `public.chores`, `public.completions`, `public.thanks` を追加済み。
  - `pg_publication` の `pubinsert/pubupdate/pubdelete/pubtruncate` はすべて `true`。
- REPLICA IDENTITY
  - `chores/completions/thanks` は `DEFAULT (d)` のまま。
  - そのため UPDATE/DELETE の WAL には主キーと変更列のみが含まれ、`owner_id/partner_id` が含まれない可能性が高い。
- クライアント（フロント実装）
  - <mcfile name="ChoresList.tsx" path="/Users/yutatokeshi/Develop/TRAE/MVP/src/components/ChoresList.tsx"></mcfile>
    - `postgres_changes` を `owner_id=eq.<uid>` / `partner_id=eq.<uid>` のフィルタ付きで購読。
    - `SUBSCRIBED` ログは出ており、チャンネルの作成・購読自体は成功。
    - 楽観的 UI のため関数型 `setState` を使用済み。
- スキーマ/RLS
  - <mcfile name="rls-policies.sql" path="/Users/yutatokeshi/Develop/TRAE/MVP/docs/rls-policies.sql"></mcfile>
    - `chores`: `owner_id = auth.uid() or partner_id = auth.uid()`
    - `completions`: 関連 `chores` の `owner/partner` に依存
    - `thanks`: `from_id/to_id` で制御

## 明日やること（What / Why）
1) `REPLICA IDENTITY FULL` を設定（Why: UPDATE/DELETE でも全列をWALに含め、フィルタに必要な `owner_id/partner_id` をサーバ側で評価可能にする）
   - SQL:
     - `ALTER TABLE public.chores REPLICA IDENTITY FULL;`
     - （必要に応じて）`ALTER TABLE public.completions REPLICA IDENTITY FULL;`
     - （必要に応じて）`ALTER TABLE public.thanks REPLICA IDENTITY FULL;`
   - 確認:
     - `SELECT n.nspname schema, c.relname table, c.relreplident replica_identity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname IN ('chores','completions','thanks') ORDER BY c.relname;`（`f` になればOK）
2) Realtime Inspector でサーバ側イベントを確認（Why: クライアントの問題か、配信経路の問題かを切り分け）
   - Channel: `db-postgres-changes` / Schema: `public` / Table: `chores` / Events: `INSERT, UPDATE, DELETE`
   - 片方のタブで CRUD 実行 → Inspector のフレームにイベントが出るか確認。
3) ブラウザ再読込後の動作確認（Why: 新しい REPLICA 設定を反映した上で購読を張り直す）
   - タブ A で 追加/完了トグル/削除 → タブ B のコンソールに `INSERT/UPDATE/DELETE (owner|partner match)` が出るか。
4) まだダメならフィルタを一時撤去（Why: フィルタ条件の不一致かどうかを切り分け）
   - 一時的に `filter` を外して `event:'*'` で購読し、イベント自体が飛んできているか検証。
5) 接続/環境確認（Why: プロジェクト不一致や wss 切断の可能性排除）
   - `.env` の `NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY` が対象プロジェクトのものか確認。
   - DevTools Network の `wss` 接続が `Open` で、Frames にイベントが積まれるか確認。

## ここまでで解決したこと
- Publication に対象テーブルを追加済み（`supabase_realtime` に 3 tables）。
- クライアントの購読は `SUBSCRIBED` まで確認できている（チャンネル生成・接続は成功）。
- 初期データ取得（REST）は正常に動作（RLSにより自分関連のみ取得）。

## 未解決・要対応
- UPDATE/DELETE のイベントが他タブへ配送されない（挙動から REPLICA IDENTITY 起因の可能性が高い）。
- INSERT も一部届かないケースがあるか要再確認（Inspector で要検証）。
- 予防的タスク: RLS の `auth.uid()` → `(select auth.uid())` 最適化は別途進める（性能課題）。

## 実行した/予定の SQL 一覧
- 実行済み（確認系）
  - `SELECT schemaname, tablename FROM pg_publication_tables WHERE pubname='supabase_realtime' ORDER BY schemaname, tablename;`
  - `SELECT pubname, pubinsert, pubupdate, pubdelete, pubtruncate FROM pg_publication ORDER BY pubname;`
  - `SELECT n.nspname schema, c.relname table, c.relreplident replica_identity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname IN ('chores','completions','thanks') ORDER BY c.relname;`
- 明日実行予定（設定系）
  - `ALTER TABLE public.chores REPLICA IDENTITY FULL;`
  - （任意）`ALTER TABLE public.completions REPLICA IDENTITY FULL;`
  - （任意）`ALTER TABLE public.thanks REPLICA IDENTITY FULL;`

## チェックリスト（明日の動作確認）
- [ ] chores を `REPLICA IDENTITY FULL` に変更した
- [ ] Inspector で INSERT/UPDATE/DELETE が観測できる
- [ ] タブ A の操作がタブ B に即時反映される
- [ ] フィルタなし購読でイベントが届く（必要時の切り分け）
- [ ] `.env` の URL/KEY が正しいプロジェクトのもの

## 参考ファイル
- クライアント実装: <mcfile name="ChoresList.tsx" path="/Users/yutatokeshi/Develop/TRAE/MVP/src/components/ChoresList.tsx"></mcfile>
- Supabase クライアント: <mcfile name="supabase.ts" path="/Users/yutatokeshi/Develop/TRAE/MVP/src/lib/supabase.ts"></mcfile>
- RLS 定義: <mcfile name="rls-policies.sql" path="/Users/yutatokeshi/Develop/TRAE/MVP/docs/rls-policies.sql"></mcfile>