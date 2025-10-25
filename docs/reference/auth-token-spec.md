# Auth Token 仕様・生成/検証/期限・権限の整理

## 概要
本ドキュメントは本MVPの認証トークンの仕様、生成/検証ロジック、期限、権限設定（RLSとの関係）を現行実装に基づき明確化します。フロントエンドはSupabaseを直接利用（PostgREST/Realtime）し、BFFは将来導入予定です。

## トークン種別と保管
- 種別: Supabase Auth による **JWT Access Token** と **Refresh Token**。
- 保管: ブラウザ `localStorage`（`src/lib/supabase.ts`の`auth.persistSession: true`設定）。
- 自動更新: `auth.autoRefreshToken: true` により、期限前にリフレッシュ（イベント `TOKEN_REFRESHED`）。
- URL検出: `auth.detectSessionInUrl: true` により、OAuthリダイレクトURLからセッションを自動確立。

## 生成/確立フロー
- Email/Password: `authService.signIn(email, password)` → セッション確立。
- SignUp: `authService.signUp(email, password, name)` → 確認メール（必要に応じて`resendConfirmation`）。セッションはサインアップ直後に未確立の場合あり、`useAuthState`が`onAuthStateChange`で確立後にプロフィール作成。
- Google OAuth（PKCE）:
  - 開始: `authService.signInWithGoogle()` → `redirectTo=/auth/callback`。
  - 交換: `src/app/auth/callback/page.tsx`にて、まず`auth.getSession()`（内部自動処理）、未確立なら`auth.exchangeCodeForSession(window.location.href)`でPKCEコード交換。
  - 完了: セッション確立後ホームへリダイレクト。

## 検証ロジック
- クライアント: Supabase JS SDKがJWTを埋め込み、PostgRESTへの呼び出しで`Authorization: Bearer <access_token>`を自動付与。
- Realtime: `NotificationProvider`が`onAuthStateChange`イベントの`session.access_token`で`realtime.setAuth()`を実行し、購読を正しく認可。
- BFF（将来）: `JWKS`を用いたSupabase JWT検証を想定（`docs/reference/api.md`の将来拡張記載）。

## 期限（Expiration）
- Access Token: Supabase管理のTTL（一般的に短時間）。`Session.expires_in`/`expires_at`がSDKから取得可能。
- Refresh Token: 自動更新に利用。`onAuthStateChange`で`TOKEN_REFRESHED`イベントに追随し、Realtimeも`setAuth`再設定。
- 実装上の注意: ブラウザのスリープ/オフライン復帰時に`rtRevision`をインクリメントして再購読を実施。

## 権限（Permissions）
- データアクセスはRLS（Row Level Security）で強制（`docs/reference/rls-policies.sql`参照）。
- 主要テーブル:
  - `chores`: `owner_id`または`partner_id`が`auth.uid()`（現在ユーザー）に一致するもののみ読み書き。
  - `completions`: `user_id = auth.uid()`のみ挿入許可。
  - `thanks`: `from_id = auth.uid()`で送信、`to_id = auth.uid()`で受信閲覧。
  - `profiles`: 自分のプロフィールのみ作成/更新。
- Realtimeフィルタ: `thanks`購読に`filter: to_id=eq.<user.id>`を付与（SKIP_AUTHやデバッグフラグ時はフォールバックチャンネル使用）。

## セキュリティ注意点
- `localStorage`保存のため、XSS対策が重要（`security.md`のCSP/エスケープ/型安全の遵守）。
- `next.config.js`のCORSは現状広め（`*`）。BFF導入時はオリジン制限を強化。
- 本番では`NEXT_PUBLIC_SKIP_AUTH`は無効（ステージング/ローカルの検証用途のみ）。

## 実装へのトレーサビリティ
- セッション/トークン生成・更新: `src/services/authService.ts` / `src/lib/supabase.ts` / `src/app/auth/callback/page.tsx`。
- 状態管理・プロフィール確立: `src/hooks/useAuthState.ts` / `src/services/profileService.ts`。
- リアルタイム認証更新: `src/contexts/NotificationContext.tsx` の `realtime.setAuth` とチャンネル管理。
- API仕様: `docs/reference/api.md` / `openapi.yaml`（Bearer JWT / Supabase REST）。