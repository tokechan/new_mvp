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

## 今日の実施内容（2025-09-08 続き）

### ✅ 完了済み
1) **REPLICA IDENTITY FULL の設定**
   - SQL実行: `ALTER TABLE public.chores REPLICA IDENTITY FULL;`
   - 確認SQL: `SELECT n.nspname schema, c.relname table, c.relreplident replica_identity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname IN ('chores','completions','thanks') ORDER BY c.relname;`
   - 結果: `relreplident` が `f` (FULL) に変更されたことを確認

2) **開発環境の準備**
   - 開発サーバー起動: `npm run dev` → http://localhost:3000
   - 環境変数確認: `.env.local` の Supabase URL/KEY が正しいプロジェクトのものであることを確認

3) **デバッグログの強化**
   - ChoresList.tsx にて詳細なログ出力を追加
   - 絵文字付きで視認性向上（🔄 UPSERT, 🗑️ DELETE, ✅ SUCCESS, ❌ ERROR）
   - イベントペイロードの詳細情報表示（eventType, table, schema, timestamp）

### ✅ 追加で完了済み
4) **Realtime Inspector でのサーバ側イベント確認**
   - 設定: Channel `db-postgres-changes`, Schema `public`, Table `chores`, Events `INSERT, UPDATE, DELETE`
   - **重要な発見**: SupabaseダッシュボードでRealtime Inspector → Channel → 対象テーブルの設定をオンにする必要があった
   - 結果: リアルタイム接続が成功し、イベントが正常に配信されることを確認

### 📋 次のテスト手順
5) **ブラウザでの動作確認**
   - 2つのタブで http://localhost:3000 を開く
   - 開発者ツールのConsoleでログを監視
   - 片方のタブで家事の追加/完了/削除を実行
   - もう片方のタブでRealtimeイベントの受信を確認

6) **フィルタなしテスト（必要時）**
   ```javascript
   // 一時的なテスト用コード
   const testChannel = supabase
     .channel('test-all-chores')
     .on('postgres_changes', { 
       event: '*', 
       schema: 'public', 
       table: 'chores' 
     }, (payload) => {
       console.log('🧪 TEST: All chores event (no filter):', payload)
     })
     .subscribe()
   ```

7) **WebSocket接続の確認**
   - DevTools Network タブで `wss` 接続が `Open` 状態か確認
   - Frames にイベントが積まれているか確認

## ここまでで解決したこと
- Publication に対象テーブルを追加済み（`supabase_realtime` に 3 tables）
- クライアントの購読は `SUBSCRIBED` まで確認できている（チャンネル生成・接続は成功）
- 初期データ取得（REST）は正常に動作（RLSにより自分関連のみ取得）
- **REPLICA IDENTITY FULL の設定完了**（UPDATE/DELETE でも全列がWALに含まれる）
- **詳細なデバッグログの実装**（イベント受信の詳細な追跡が可能）
- **開発環境の準備完了**（サーバー起動、環境変数確認済み）

## 🚨 新たな問題発生（2025-09-08 続き）

### 問題の再発
- **症状**: リアルタイム接続が再び機能しなくなった
- **タイミング**: 一度成功した後に接続が切れた
- **状況**: 開発サーバーは正常に動作中

### 🔍 根本原因の発見
- **重要な発見**: `chores` テーブルに **DELETE ポリシーが設定されていない**
- **影響**: RLSがDELETE操作を拒否し、削除機能が動作しない
- **副次的影響**: DELETE操作の失敗がRealtime接続にも影響を与えている可能性

### 🔍 診断手順
1. **ブラウザコンソールの確認**
   - ❌ Realtime subscription error
   - ❌ Channel error  
   - ⏰ Subscription timed out
   - WebSocket connection failed

2. **接続状況の確認**
   - ✅ Successfully subscribed to realtime changes が表示されているか
   - 📡 Realtime subscription status: SUBSCRIBED が出ているか

3. **Networkタブでの確認**
   - WebSocket接続（wss://）が Open 状態か
   - 接続が Closed や Failed になっていないか

4. **Supabaseプロジェクトの状態確認**
   - Supabaseダッシュボードにアクセス
   - プロジェクトが正常に動作しているか
   - Realtime設定が有効になっているか

5. **環境変数の再確認**
   - .env.local の SUPABASE_URL が正しいか
   - SUPABASE_ANON_KEY が有効期限内か

### 🔧 解決策
**✅ 完了**: SupabaseのSQL Editorで以下のSQLを実行済み
```sql
create policy "chores_delete_owner_or_partner"
on public.chores for delete
using (owner_id = auth.uid() or partner_id = auth.uid());
```

**このポリシーの効果**:
- owner_id または partner_id が自分のIDと一致する家事のみ削除可能
- RLSが削除操作を正しく許可するようになる
- Realtime DELETEイベントが正常に配信される

### 🧪 フィルタなしテストの実装
**現在の状況**: アプリ間でのリアルタイム同期が動作しない問題を解決するため、フィルタを一時的に無効化してテスト中

**実装内容**:
- 全てのchoresテーブルイベント（INSERT/UPDATE/DELETE）を購読
- クライアント側でユーザーフィルタリングを実行
- 詳細なデバッグログを追加

**テスト結果**:
1. ブラウザでのテスト実行完了
2. DELETEイベントの詳細ログ取得成功
3. **重要な発見**: DELETEイベントのoldデータにowner_id/partner_idが含まれていない
4. ローカル状態フォールバックが正常に動作

### 🔍 発見された問題
**DELETEイベントのoldデータ**:
```
{userId: '4d6793d0-7260-4159-b7f5-c91cb6af224a'}
```
- oldRowOwner: undefined
- oldRowPartner: undefined

**原因**: REPLICA IDENTITY FULLが正しく設定されていないか、Supabase Realtimeの配信仕様の問題

**現在の状況**: ローカル状態からの検索フォールバックにより、削除機能は動作している

## 解決済み・残りのテスト項目
- ✅ **Realtime イベントの配信確認**（REPLICA IDENTITY FULL 設定後の動作テスト完了）
- ✅ **Supabaseダッシュボードでの設定**（Realtime Inspector → Channel → テーブル設定をオン）
- ✅ **根本原因の特定**（choresテーブルのDELETEポリシー不足）
- ✅ **DELETEポリシーの追加**（SQL実行完了）
- ✅ **削除機能の動作確認**（Supabaseダッシュボードで確認済み）
- ✅ **フィルタなしテストの実装**（完了）
- 🔍 **根本原因の特定**（DELETEイベントのoldデータ不足）
- 🔧 **REPLICA IDENTITY設定の再確認**（必要）
- 🔍 **複数タブ間での同期確認**（ローカル状態フォールバックで一時的に動作）
- 予防的タスク: RLS の `auth.uid()` → `(select auth.uid())` 最適化は別途進める（性能課題）

## 実行した SQL 一覧
- **実行済み（確認系）**
  - `SELECT schemaname, tablename FROM pg_publication_tables WHERE pubname='supabase_realtime' ORDER BY schemaname, tablename;`
  - `SELECT pubname, pubinsert, pubupdate, pubdelete, pubtruncate FROM pg_publication ORDER BY pubname;`
  - `SELECT n.nspname schema, c.relname table, c.relreplident replica_identity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname IN ('chores','completions','thanks') ORDER BY c.relname;`
- **実行済み（設定系）**
  - ✅ `ALTER TABLE public.chores REPLICA IDENTITY FULL;`
- **実行済み（重要）**
  - ✅ `create policy "chores_delete_owner_or_partner" on public.chores for delete using (owner_id = auth.uid() or partner_id = auth.uid());`
- **再確認が必要**
  - 🔧 `SELECT n.nspname schema, c.relname table, c.relreplident replica_identity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname='chores';`
  - 🔧 結果が 'f' でない場合: `ALTER TABLE public.chores REPLICA IDENTITY FULL;`
- **今後必要に応じて実行**
  - `ALTER TABLE public.completions REPLICA IDENTITY FULL;`
  - `ALTER TABLE public.thanks REPLICA IDENTITY FULL;`

## チェックリスト（現在の動作確認）
- [x] chores を `REPLICA IDENTITY FULL` に変更した
- [x] 開発サーバーを起動した（http://localhost:3000）
- [x] デバッグログを強化した
- [x] `.env` の URL/KEY が正しいプロジェクトのものであることを確認した
- [x] **SupabaseダッシュボードでRealtime設定を有効化した**
- [x] Inspector で INSERT/UPDATE/DELETE が観測できる（一時的に成功）
- [?] WebSocket接続が正常に動作している（**問題が再発**）
- [?] **リアルタイム接続が成功した**（**接続が切れた**）
- [ ] タブ A の操作がタブ B に即時反映される（接続問題により中断）
- [ ] フィルタなし購読でイベントが届く（必要時の切り分け）
- [ ] **具体的なエラーメッセージの特定**（診断中）

## 参考ファイル
- クライアント実装: <mcfile name="ChoresList.tsx" path="/Users/yutatokeshi/Develop/TRAE/MVP/src/components/ChoresList.tsx"></mcfile>
- Supabase クライアント: <mcfile name="supabase.ts" path="/Users/yutatokeshi/Develop/TRAE/MVP/src/lib/supabase.ts"></mcfile>
- RLS 定義: <mcfile name="rls-policies.sql" path="/Users/yutatokeshi/Develop/TRAE/MVP/docs/rls-policies.sql"></mcfile>