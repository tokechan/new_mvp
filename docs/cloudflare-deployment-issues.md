# Cloudflare Pages デプロイ後の認証問題と解決方法

## 発生した問題

### 問題1: テストユーザーで自動ログインしてしまう
- **現象**: 本番URLにアクセスすると、テストユーザー（test@example.com）で自動的にログインしてしまう
- **影響**: 実際のユーザーが正常にログインできない

### 問題2: Google認証でlocalhost:3000にリダイレクトされる
- **現象**: ログアウト後にGoogleログインを試すと、localhost:3000にリダイレクトされてエラーになる
- **影響**: Google OAuth認証が機能しない

## 原因分析

### 問題1の原因
- **環境変数設定ミス**: Cloudflare Workersの環境変数に `NEXT_PUBLIC_SKIP_AUTH=true` が設定されている
- **テスト機能の本番流出**: 開発・テスト環境用の認証スキップ機能が本番環境でも動作している
- **コード箇所**: `src/features/auth/hooks/useAuthState.ts` の17行目で環境変数をチェックしている

```typescript
import { shouldUseMockAuth } from '@/utils/authMode'

if (shouldUseMockAuth()) {
  // テスト用のモックユーザーを設定
}
```

### 問題2の原因
- **リダイレクトURL設定不備**: Supabase認証設定でlocalhost:3000が優先されている
- **OAuth設定の不整合**: Google Cloud ConsoleとSupabaseの設定が本番URLに対応していない
- **コード箇所**: `src/features/auth/services/authService.ts` の47行目でリダイレクトURLを動的生成している

```typescript
redirectTo: `${window.location.origin}/auth/callback`
```

## 解決方法

### 1. Cloudflare Pages環境変数の修正

**手順**:
1. [Cloudflareダッシュボード](https://dash.cloudflare.com) にアクセス
2. Pages → プロジェクト選択
3. Settings → Environment variables
4. `NEXT_PUBLIC_SKIP_AUTH` 変数を**削除**
5. 変更を保存

**注意**: この変数は開発・テスト環境でのみ使用すべき

### 2. Supabase認証設定の修正

**手順**:
1. [Supabaseダッシュボード](https://supabase.com/dashboard) にアクセス
2. プロジェクト → Authentication → URL Configuration
3. **Site URL**を更新:
   ```
   https://household-task-mvp.fleatoke.workers.dev
   ```
4. **Redirect URLs**に追加:
   ```
   https://household-task-mvp.fleatoke.workers.dev/auth/callback
   https://household-task-mvp.fleatoke.workers.dev/**
   ```
5. localhost:3000の設定を削除または無効化

### 3. Google Cloud Console OAuth設定の確認

**手順**:
1. [Google Cloud Console](https://console.cloud.google.com) にアクセス
2. APIs & Services → Credentials
3. OAuth 2.0 クライアントIDを選択
4. **承認済みリダイレクト URI**に追加:
   ```
   https://household-task-mvp.fleatoke.workers.dev/auth/callback
   ```
5. 変更を保存

## 修正後の確認手順

### 1. デプロイと設定反映
```bash
# 再デプロイ（環境変数変更を反映）
npm run deploy:staging
```

### 2. 動作確認
1. **ブラウザキャッシュをクリア**
2. **シークレットモードでアクセス**
3. 以下の動作を確認:
   - [ ] 自動ログインが発生しない
   - [ ] Google認証が正常に動作する
   - [ ] 本番URLにリダイレクトされる
   - [ ] ログアウト→再ログインが正常に動作する

### 3. テスト実行
```bash
# E2Eテストで認証フローを確認
npm run test:e2e

# アクセシビリティテスト
npm run test:a11y
```

## 予防策

### 1. 環境変数管理の改善
- **開発環境**: `.env.local` で `NEXT_PUBLIC_SKIP_AUTH=true`
- **テスト環境**: CI/CDで自動設定
- **本番環境**: 絶対に設定しない

### 2. デプロイ前チェックリスト
- [ ] 環境変数の確認（テスト用設定が含まれていないか）
- [ ] Supabase URL設定の確認
- [ ] Google OAuth設定の確認
- [ ] 認証フローのE2Eテスト実行

### 3. 監視とアラート
- Cloudflare Analyticsで認証エラー率を監視
- Supabase Logsで認証失敗を監視
- 異常検知時のアラート設定

## 関連ドキュメント

- [Google OAuth設定ガイド](./google-oauth-setup.md)
- [Cloudflare Pages デプロイ戦略](./adr/ADR-0002-cloudflare-workers-deployment.md)
- [運用ランブック](./reference/operations-runbook.md)
- [リリースチェックリスト](./reference/checklist-release.md)

## 更新履歴

- 2024-12-22: 初版作成（Cloudflare Workers認証問題の調査・解決）
- 2025-01-22: Cloudflare Pages移行に伴う更新
