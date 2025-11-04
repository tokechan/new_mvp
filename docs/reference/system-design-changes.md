# System Design 変更点の詳細レビュー

## 概要
本ドキュメントは、既存の設計ドキュメント（architecture.md / security.md / api.md など）と現行実装の差分を整理し、変更されたモジュール/コンポーネントの特定、設計変更の理由、および影響範囲を明確化します。

## 設計ドキュメントとの主な差分
- 認証方式: 設計上の方針通り「Supabase Auth（Email Link / Google OAuth）+ JWT + RLS」。NextAuth 依存は削除し、Supabase Auth 単独構成を採用。
- OAuth PKCE: 以前は手動実装の痕跡がありましたが、現行はSupabaseの`auth.getSession()`と`auth.exchangeCodeForSession(url)`による自動処理へ統一（devlog/pkce-error-resolution.md の方針反映）。
- Realtime 認証連携: ドキュメントの記載は簡略でしたが、現行実装では`NotificationProvider`で`onAuthStateChange`イベントを監視し、`realtime.setAuth(session.access_token)`を確実に実行する設計へ強化。
- セッション保持: SSRブラウザクライアント（@supabase/ssr）で`autoRefreshToken: true`/`persistSession: true`/`detectSessionInUrl: true`を採用。テスト・デモ用に`NEXT_PUBLIC_SKIP_AUTH`を導入（モック認証と最小限のRLS検証のため）。

## 変更されたモジュール/コンポーネント
- `src/app/auth/callback/page.tsx`
  - 役割: OAuthリダイレクトの受け口。
  - 変更: `getSession()`の自動PKCE処理を優先し、未確立時のみ`exchangeCodeForSession()`をフォールバック実行。
  - 影響: PKCEエラーの減少・保守容易化。失敗時のハンドリングを集約。

- `src/features/auth/services/authService.ts`
  - 役割: Supabase認証のラッパ。統一返却型`{ data, error }`を採用。
  - 変更: `signIn`, `signUp`, `signOut`, `signInWithGoogle`, `resendConfirmation`, `getSession`, `onAuthStateChange`の整理。自動ログインの独自実装は撤廃（Supabaseのセッション維持に委譲）。
  - 影響: 認証操作の共通化・ログ出力標準化・例外対応の一元化。

- `src/features/auth/hooks/useAuthState.ts`
  - 役割: 認証状態（`user`/`session`/`loading`）管理。
  - 変更: 初期セッション取得、`onAuthStateChange`購読、`profileService.ensureProfile(user)`の自動作成/検証を組み込み。テスト/デモ向けモック認証（`NEXT_PUBLIC_SKIP_AUTH`）を明示。
  - 影響: サインアップ直後のプロフィール確立遅延の吸収、UI初期化の安定化。

- `src/contexts/NotificationContext.tsx`
  - 役割: リアルタイム通知（家事の追加/更新、ありがとう受信）。
  - 変更: `supabase.auth.onAuthStateChange`で`TOKEN_REFRESHED`/`SIGNED_IN`イベントに追随して`realtime.setAuth(session.access_token)`を更新。チャンネルの管理・再購読のレース対策を強化。
  - 影響: トークン更新時の通知取りこぼしを防止。SKIP_AUTHやデバッグフラグ（`NEXT_PUBLIC_DEV_THANKS_NOFILTER`）で運用性を向上。

- `src/lib/supabase.ts`
  - 役割: ブラウザ向けSupabaseクライアントの単一インスタンス作成。
  - 変更: `autoRefreshToken: true`/`persistSession: true`/`detectSessionInUrl: true`/`localStorage`保存を明示。`createSupabaseBrowserClient()`で単一インスタンスを返却。
  - 影響: セッション持続と自動更新の信頼性を向上。Realtimeの認証連携が容易に。

- `next.config.js`
  - 役割: CORSヘッダーなど。
  - 変更: `Access-Control-Allow-Origin: *` などの緩め設定。現状ではフロント→Supabase直アクセスで影響最小だが、BFF導入時は適切に制限する必要あり。

## 設計変更の理由
- PKCEの手動処理は実装/保守コストとエラー率が高く、Supabaseの自動処理へ移行して信頼性と一貫性を確保。
- 認証操作/状態管理の単一責務化（`authService`/`useAuthState`/`useAuthActions`分離）により可読性・テスト容易性を改善。
- Realtimeの認証連携（`realtime.setAuth`）をイベント追随で確実化し、通知の欠落を防止。

## 影響範囲の分析
- 認証UX: Google/Authのコールバック安定化。セッション再取得/自動更新の改善。
- セキュリティ: トークンは`localStorage`保存（Supabase規定）。XSS耐性の維持が重要。RLSでDB側強制を継続。
- 運用: デバッグ/検証フラグによりステージング/ローカルでの確認が容易。
- 将来拡張: BFF（Workers/Hono）導入時は`JWKS`でSupabase JWT検証、CORS制限、NextAuth連携の再評価が必要。

## 推奨アクション
- CORS設定の見直し（BFF導入時にオリジン制限）。
- `NEXT_PUBLIC_SKIP_AUTH`の使用範囲をステージング/ローカルに限定し、本番では無効化を保証。
- LP と設定画面に追加した Google フィードバックフォームの URL を、本番用の実際のフォームに差し替える。
