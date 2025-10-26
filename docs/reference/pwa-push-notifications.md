
# PWA × Web Push × Hono(BFF) × Supabase — 実現性検証メモ
_更新日: 2025-10-26_

## 結論
**iOS（16.4+）でも、PWA をホーム画面に追加（A2HS）していれば Web Push により通知センターへ通知可能。**  
Next.js + Supabase だけだと「アプリ非起動時」の到達が弱いので、**Hono を BFF として挟み、Web Push（VAPID もしくは FCM）を送出**する構成が現実的。

---

## 背景と前提
- Supabase Realtime は WebSocket ベース：**アプリ起動中のリアルタイム UI 反映**に強いが、**非起動時の通知**は不可。
- iOS / iPadOS **16.4 以降**：**ホーム画面に追加（A2HS）した PWA** で **Web Push** が利用可能。  
  - 必須: Service Worker / Push API / Notifications API / 明示的な通知許可
- Android やデスクトップは従来どおり Web Push の適用範囲が広い。

---

## 何を Hono（BFF）でやるのか？（価値）
1. **秘密鍵の保護**：Supabase Service Role Key、VAPID 秘密鍵などはクライアントに出さない。
2. **通知ハブ**：DB や Realtime のイベントを受けて **Web Push / FCM** を発火。
3. **外部サービス連携**：メール、Slack、翻訳、課金などを一箇所に集約。
4. **型安全 & 入力検証**：Zod バリデーションを BFF 入口で実施。
5. **運用機能**：Rate limit、監査ログ、Cloudflare Cron/Queues による再試行や定期配信。

---

## 全体アーキテクチャ（ざっくり）
```
[Next.js (PWA)]
  ├─ Service Worker（push/notificationclick）
  └─ UI: Realtime（開いている間の即時反映）
        ↓ /api/*
[Hono (BFF on Cloudflare Workers)]
  ├─ 認証検証 / Zod バリデーション
  ├─ Supabase（最小権限）で DB 操作
  ├─ Web Push 送信（VAPID） or FCM 送信
  ├─ Rate limit / 監査ログ
  └─ Queues（再試行/遅延）・Cron（定期通知）
        ↓
[Supabase: Postgres / Realtime]
```

- **起動中**：Supabase Realtime で UI 即時更新
- **非起動**：Hono → Web Push（VAPID）または FCM で通知センターへ

---

## 成立条件（iPhone に通知を出す）
- iOS / iPadOS **16.4+**
- **ホーム画面に追加（Add to Home Screen）** された PWA
- **Service Worker 稼働** + **Push API / Notifications API**
- ユーザーの **通知許可**（`Notification.requestPermission()`）

> ※ Safari 上で開いているだけでは不可。**A2HS 前提**。

---

## 実装プラン（フェーズ分割）
### Phase 1（最短で価値）
- Realtime で「完了/ありがとう」を **アプリ内トースト** 等で即時反映。
- Next.js に **PWA 基盤**（`manifest.json`、Service Worker）を導入。

### Phase 2（通知センターまで）
- PWA で **Push Subscription** を取得 → **Hono `/push/subscribe`** に保存（Supabaseに格納）。
- Hono で **VAPID 鍵** を保持して **Web Push 送信**（または FCM 採用）。
- UI に **A2HS 導線**（「ホーム画面に追加してね」）を整備。

### Phase 3（運用 & 拡張）
- BFF に **レート制限**・**監査ログ**。
- **Cloudflare Queues** で再試行/遅延/バッチ、**Cron** で朝のまとめ通知など。

---

## 技術選択：VAPID（純 Web Push） vs FCM
| 観点 | VAPID（純 Web Push） | FCM（Firebase Cloud Messaging） |
|---|---|---|
| 導入の軽さ | ◎（シンプル） | △（やや重量級） |
| ベンダーロック | 低い | 高め（Google 依存） |
| iOS 対応 | iOS16.4+の A2HS 前提で可 | **同じく** Web Push 経由で可 |
| 分析/AB 機能 | △ | ◎（エコシステム強い） |

**現状規模なら VAPID 一本で開始 → 必要に応じて FCM を併用/移行**がバランス良。

---

## チェックリスト（動くまでの最低限）
- [ ] `manifest.json`（`display: "standalone"`, `start_url`, アイコン類）
- [ ] Service Worker（push/notificationclick ハンドラ）
- [ ] A2HS の UX 導線（オンボーディング）
- [ ] Hono：`/push/subscribe` と業務イベント API（例：`/thanks`）
- [ ] VAPID 公開/秘密鍵（BFF 環境変数で保持）
- [ ] Supabase：`push_subscriptions`（user_id, endpoint, keys）テーブル
- [ ] Rate limit / 監査ログ / 再送（Queues）

---

## 参考コード（超ざっくり・疑似）
**Hono: 購読保存**
```ts
app.post('/push/subscribe', zValidator('json', SubscriptionSchema), async (c) => {
  const sub = c.req.valid('json')
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE)
  const userId = c.get('userId')
  await supabase.from('push_subscriptions').upsert({ user_id: userId, subscription: sub })
  return c.json({ ok: true })
})
```

**Hono: “ありがとう” → 相手に Push**
```ts
app.post('/thanks', zValidator('json', ThanksSchema), async (c) => {
  const { toUserId, message } = c.req.valid('json')
  // ... DB 保存
  // ... toUserId の subscription を取得して Web Push 送信
  return c.json({ ok: true })
})
```

**SW: push 受信**
```js
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {}
  event.waitUntil(self.registration.showNotification(data.title || '通知', { body: data.body, data }))
})
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(clients.openWindow(url))
})
```

---

## まとめ
- **実現性：高**（iOS16.4+ / A2HS / SW / 権限が条件）。
- **Hono BFF** で「鍵/配信/外部連携/運用」を一箇所に集約 → 拡張しやすく安全。
- **Realtime は UI 即時反映、Push は非起動時の到達**。役割分担が明確。

---

## 次のアクション
- 雛形を作成（Next.js PWA + Hono + Supabase + Web Push）
- まずは **VAPID 版**で PoC → iOS/Android/PC で通知の到達を確認
- 需要次第で **FCM 連携**・Queues/Cron による運用強化へ

## A2HS 導線メモ（初期案）
- **トリガー**：初回ログイン後 3 回目のアクセス、または 2 日目以降のアクセス時にモーダル/バナーで案内。
- **メッセージ案**：「通知を受け取るにはホーム画面に追加してください」＋ iOS/Android それぞれの手順リンク。
- **スヌーズ**：`あとで`（7 日後に再表示）、`完了`（二度と表示しない）の 2 ボタンを想定。
- **検出**：`window.matchMedia('(display-mode: standalone)')` と `navigator.standalone` で既に A2HS 済みか判定し、表示を抑止。
- **計測**：表示回数・完了率を Supabase あるいは PostHog でイベント計測し、訴求強度を調整。
