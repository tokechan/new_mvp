# Web Push 実装サマリ（iOS 対応版）

最終更新: 2025-11-01

YOUDO における Web Push 機能の実装と運用上の要点をまとめたドキュメントです。特に iOS PWA で通知を有効化する際に必要な処理や環境変数管理を中心に記載しています。

---

## 1. コンポーネント構成

| 役割 | ファイル | 補足 |
| ---- | -------- | ---- |
| ランディング UI | `src/app/(marketing)/page.tsx` | PWA を含む公開サイトの入口。|
| 設定 UI | `src/app/settings/page.tsx` | Push 有効化/解除ボタンを提供。|
| クライアント購読ロジック | `src/services/pushSubscriptionService.ts` / `pushSubscriptionSafe.ts` | フラグ判定、iOS 再試行、BFF 登録。|
| API クライアント | `src/services/apiClient.ts` | Supabase セッションからアクセストークンを付与。|
| BFF (Hono/Cloudflare Worker) | `src/bff/app.ts` | `/push/subscribe` `/push/unsubscribe` を実装し Supabase を更新。|
| Service Worker | `public/sw.js` | `push` / `notificationclick` ハンドラ。|

---

## 2. フロント側フロー

1. **環境フラグ確認** – `NEXT_PUBLIC_ENABLE_PWA`, `NEXT_PUBLIC_ENABLE_PUSH_SUBSCRIPTIONS`, `NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY` が揃っていない場合は `unsupported` を返す。
2. **通知許可** – ユーザー操作イベント内で `Notification.requestPermission()` を呼び、`granted` でなければ処理終了。
3. **Service Worker 準備** – `navigator.serviceWorker.ready` を待機。Safari iOS は起動直後に `InvalidStateError` が出やすいため `getSubscriptionSafe()` で 500ms 間隔の再試行を実施。
4. **既存購読の再利用** – `pushManager.getSubscription()` で取得できた場合はそのまま BFF に同期。`subscription.toJSON()` にキーが無い場合は `subscription.getKey()` で補完。
5. **再購読** – 同期に失敗した場合は最大 3 回 `unsubscribe()` → 500ms 待機 → 再取得。iOS では `ArrayBuffer` と `Uint8Array` 両方で `subscribe()` を試し、ログに VAPID キー長・末尾バイトを出力。
6. **BFF 登録** – Supabase セッションから `userId` を取得し、`/push/subscribe` に `{ userId, endpoint, keys, metadata }` を POST。成功したら UI に反映。
7. **解除フロー** – `/push/unsubscribe` → `subscription.unsubscribe()` の順で実行し、DB とブラウザの購読を削除。

---

## 3. iOS (16.4+) 向け注意点

- **standalone 条件**: Home Screen から起動した PWA でのみ Push API が有効。UX 上の案内が必須。
- **InvalidStateError**: Service Worker 起動直後に `getSubscriptionSafe()` が失敗するため、リトライ実装で吸収。
- **InvalidAccessError**: `applicationServerKey` が Safari の期待する BufferSource と異なると発生。`ArrayBuffer` と `Uint8Array` 両方で subscribe を試行し、失敗時はログを残す。
- **購読 purge**: 古い購読が残っている場合は最大 3 回 `unsubscribe()` を実行。解除できない場合はユーザーにブラウザ設定で通知をリセットしてもらう。

---

## 4. 環境変数と鍵管理

- `.env.local`, `.env.staging`, `.env.production` の `NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY` を統一する。
- Cloudflare Workers では `wrangler deploy --var` と `wrangler secret put` を利用して更新する。

  ```bash
  npx wrangler deploy --env staging \
    --var NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY="BH2O-GpKu_D4FcYVzPQK17qq2PCa0KDEYJXyYv_W8CA38oY-tJ_syj9mtyTt_lJvNn7F8qQns75yR2QJARXLzr0" \
    --keep-vars

  npx wrangler secret put WEB_PUSH_PRIVATE_KEY --env staging
  ```

- VAPID 鍵の再生成は `npm run push:vapid:generate`（`npx web-push generate-vapid-keys`）。再生成時は公開鍵・秘密鍵を全環境で差し替える。

---

## 5. デプロイと検証

1. `npm run build:cloudflare`
2. `npm run deploy:staging`
3. iOS PWA を再起動 → 設定画面で購読 → コンソールで以下を確認
   - `[PushSafe] VAPID key decoded – { length: 65, firstByte: 4, lastByte: 189 }`
   - `[PushSafe] subscription created ...`
4. Supabase `push_subscriptions` テーブルにレコードが作られていることを確認。
5. 通知送信テストで端末に到達するかを検証。

---

## 6. トラブルシューティング

| 症状 | 想定原因 | 対処 |
| ---- | -------- | ---- |
| `InvalidAccessError: applicationServerKey must contain a valid P-256 public key` | 公開鍵不一致 / Base64 ミス | `.env` と Cloudflare Vars の鍵を照合。ログの `lastByte` が 189 か確認。|
| `InvalidStateError: Getting push subscription requires a service worker` | iOS の SW 起動直後 | リトライ実装で吸収。ユーザーには PWA 再起動を案内。|
| BFF が 503 応答 | `ENABLE_PUSH_SUBSCRIPTIONS` フラグが無効 | `wrangler.toml` と Vars を確認。|
| Supabase upsert エラー | Service Role キー未設定 / RLS | Worker の環境変数と DB 権限を確認。|
| 通知が届かない | デバイス設定で通知 OFF / 購読が古い | iOS 設定で通知をトグルし、必要なら PWA 再インストール。|

---

## 7. 今後の拡張案

- Cloudflare Queues で再送・バッチ配信
- 端末情報の Supabase 保存による分析
- A2HS や通知テストボタンなど UX 強化
- 鍵ローテーション手順の自動化

---

以上。
