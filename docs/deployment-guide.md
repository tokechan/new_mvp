# デプロイメントガイド

## 概要

このドキュメントでは、Household MVPアプリケーションのCloudflare Workersへのデプロイメントプロセスについて説明します。

## 前提条件

### 必要なツール
- Node.js (v18以上)
- npm
- Cloudflare アカウント
- Wrangler CLI

### 環境変数の設定
以下の環境変数がCloudflareダッシュボードで設定されている必要があります：

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
NEXTAUTH_SECRET
NEXTAUTH_URL
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
```

## デプロイメント方法

### 1. 自動デプロイメント（推奨）

GitHubにプッシュすると、Cloudflareダッシュボードで自動的にデプロイが実行されます。

```bash
# 変更をコミット
git add .
git commit -m "デプロイメント用の変更"

# リモートリポジトリにプッシュ
git push origin dev
```

### 2. 手動デプロイメント

自動デプロイが失敗した場合や、緊急時には手動デプロイを実行できます。

#### Stagingへのデプロイ

```bash
# Cloudflare用ビルドを実行
npm run build:cloudflare

# Stagingにデプロイ
npx wrangler deploy --env staging
```

#### Productionへのデプロイ

```bash
# Cloudflare用ビルドを実行
npm run build:cloudflare

# Productionにデプロイ
npx wrangler deploy --env production
```

## ビルドスクリプトの説明

### package.jsonのスクリプト

```json
{
  "scripts": {
    "build": "next build",
    "build:cloudflare": "opennextjs-cloudflare build",
    "build:staging": "next build",
    "build:production": "next build"
  }
}
```

- `build`: 標準のNext.jsビルド
- `build:cloudflare`: Cloudflare Workers用のビルド
- `build:staging`: Staging環境用のビルド
- `build:production`: Production環境用のビルド

## 設定ファイル

### wrangler.toml

Cloudflare Workersの設定ファイルです。

```toml
name = "household-mvp"
compatibility_date = "2024-11-21"
compatibility_flags = ["nodejs_compat"]

[build]
command = "npm run build:cloudflare"

[env.staging]
name = "household-mvp-staging"
vars = { ENVIRONMENT = "staging" }

[env.production]
name = "household-mvp-production"
vars = { ENVIRONMENT = "production" }
```

### open-next.config.ts

OpenNextの設定ファイルです。

```typescript
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({});
```

## トラブルシューティング

### よくある問題と解決策

#### 1. ビルドの無限ループ

**症状**: ビルドが永続的に実行され続ける

**原因**: `package.json`の`build`スクリプトが`opennextjs-cloudflare build`を呼び出し、それが内部で`npm run build`を再度呼び出すため

**解決策**: 
- `build`スクリプトを`next build`に変更
- `build:cloudflare`スクリプトを追加
- `wrangler.toml`のビルドコマンドを`npm run build:cloudflare`に変更

#### 2. 環境変数が見つからない

**症状**: デプロイ後にアプリケーションが正常に動作しない

**解決策**: 
1. Cloudflareダッシュボードで環境変数を確認
2. 必要な環境変数がすべて設定されているか確認
3. 環境変数の値が正しいか確認

#### 3. メタデータエラー

**症状**: Next.js 15でメタデータ関連のエラーが発生

**解決策**: 
- `layout.tsx`で`themeColor`と`viewport`を分離
- `not-found.tsx`ページを作成

## デプロイメント後の確認事項

### 1. アプリケーションの動作確認

- Staging: https://household-mvp-staging.fleatoke.workers.dev
- Production: https://household-mvp-production.fleatoke.workers.dev

### 2. 確認項目

- [ ] ページが正常に読み込まれる
- [ ] ログイン機能が動作する
- [ ] データベース接続が正常
- [ ] リアルタイム機能が動作する
- [ ] 静的アセットが正しく配信される

### 3. ログの確認

Cloudflareダッシュボードでデプロイメントログとランタイムログを確認します。

## セキュリティ考慮事項

- 環境変数は絶対にコードにハードコードしない
- 本番環境の認証情報は適切に管理する
- HTTPS通信を必須とする
- CSPヘッダーを適切に設定する

## パフォーマンス最適化

- 静的アセットのキャッシュ設定
- 画像の最適化
- バンドルサイズの監視
- エッジでの実行による低レイテンシ

## 監視とアラート

- Cloudflareダッシュボードでのメトリクス監視
- エラーレートの監視
- レスポンス時間の監視
- 可用性の監視

## 緊急時の対応

### ロールバック手順

1. 前のバージョンのコミットハッシュを確認
2. 該当コミットにリセット
3. 手動デプロイを実行

```bash
git reset --hard <前のコミットハッシュ>
npm run build:cloudflare
npx wrangler deploy --env production
```

### 緊急連絡先

- 開発チーム: [連絡先情報]
- インフラチーム: [連絡先情報]
- Cloudflareサポート: [サポート情報]

## 更新履歴

| 日付 | バージョン | 変更内容 | 担当者 |
|------|------------|----------|--------|
| 2025-01-25 | 1.0.0 | 初版作成 | 開発チーム |

---

このドキュメントは定期的に更新され、最新のデプロイメントプロセスを反映します。