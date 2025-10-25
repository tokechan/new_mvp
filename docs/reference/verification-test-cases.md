# 実装とドキュメントの整合性検証テストケース（非実行）

目的: 更新後のドキュメント（System Design/Token Spec）と現行実装が一致していることを確認するためのテストケース案。E2E（Playwright）/ユニット（Jest）を想定。

## 認証フロー（Email/Password）
- TC-A01: サインイン成功で`session.user.id`/`access_token`が取得できる
  - 前提: 有効なユーザーが存在
  - 手順: `signIn(email, password)`→`useAuthState`が`user`/`session`更新
  - 期待: `session.access_token`存在、`loading=false`
- TC-A02: サインアップ後に`onAuthStateChange`でプロフィールが自動作成/検証される
  - 手順: `signUp(email, password, name)`→認証確立後`profileService.ensureProfile(user)`実行
  - 期待: `profiles`に`id = auth.uid()`の行が存在

## 認証フロー（Google OAuth / PKCE）
- TC-G01: OAuth開始で`redirectTo`が`/auth/callback`に設定される
  - 手順: `signInWithGoogle()`のリクエスト検証
  - 期待: `options.redirectTo`が`/auth/callback`
- TC-G02: コールバックで`getSession()`自動処理が成功する（未確立時は`exchangeCodeForSession`）
  - 手順: `auth/callback`ページ遷移→`getSession()`→フォールバック検証
  - 期待: `session.user.id`が取得できる

## トークン更新とRealtime連携
- TC-T01: `TOKEN_REFRESHED`イベント受信時に`realtime.setAuth`が再設定される
  - 手順: トークン期限切れ手前まで進めリフレッシュ発火（またはモック）
  - 期待: `NotificationProvider`ログに`realtime auth updated`が出力、購読継続
- TC-T02: 可視化/オンライン復帰で再購読が走る
  - 手順: `visibilitychange`/`online`イベント発火
  - 期待: `rtRevision`インクリメント、チャンネル再作成ログ

## RLS権限制御
- TC-R01: 他人の`chores`は取得できない
  - 手順: Supabaseから`chores`一覧取得
  - 期待: `owner_id`または`partner_id`が自分のもののみ
- TC-R02: `completions`は自分の`user_id`のみ挿入可能
  - 手順: `completions.insert({ user_id: someone_else })`
  - 期待: RLSにより拒否（エラー）
- TC-R03: `thanks`は`from_id=auth.uid()`のみ送信/`to_id=auth.uid()`のみ受信
  - 手順: 送受信/履歴取得
  - 期待: RLSルール通りの結果

## CORS/セキュリティ
- TC-S01: `Authorization: Bearer <token>`ヘッダーがSupabaseリクエストに付与される
  - 手順: SDKのリクエストヘッダー確認（モック/インターセプト）
  - 期待: Bearerヘッダー存在
- TC-S02: `localStorage`にセッションが保存される
  - 手順: ブラウザ側で`localStorage`確認
  - 期待: セッション保存（SDK規定キー）

## ドキュメント整合性
- TC-D01: `api.md`/`openapi.yaml`に記載のBearer JWT方式と実際のリクエストが一致
- TC-D02: `system-design-changes.md`に列挙の変更点がコードの該当箇所に存在
- TC-D03: `auth-token-spec.md`の仕様（自動更新/検出/Realtime連携）が実装ログと一致

## 備考
- 実行は不要。本書はテスト設計の参照用。
- 実行時はE2EでUI遷移、ユニットでhooks/services、インテグレーションでSupabaseのRLS/Realtimeを確認する構成が望ましい。