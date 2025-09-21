# ADR-0002: Cloudflare Workers デプロイメント戦略

## ステータス

承認済み

## 日付

2024-12-22

## 背景

家事管理MVPアプリケーションのデプロイメント環境として、Cloudflare Workersを選択し、実装を完了した。Next.js 15アプリケーションをCloudflare Workers上で動作させるための設定と最適化を行った。

## 決定事項

### デプロイメント戦略

1. **プラットフォーム**: Cloudflare Workers + Pages
2. **ビルドツール**: @opennextjs/cloudflare を使用
3. **環境分離**: staging と production の2環境
4. **設定管理**: wrangler.jsonc と wrangler.toml の併用

### 技術実装

#### デプロイスクリプト
```json
{
  "deploy:staging": "npm run build:staging && npx wrangler pages deploy .next --project-name=household-mvp-staging",
  "deploy:production": "npm run build:production && npx wrangler pages deploy .next --project-name=household-mvp",
  "preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview"
}
```

#### 設定ファイル構成
- `wrangler.jsonc`: OpenNext用の設定（worker.js、assets、limits）
- `wrangler.toml`: Pages用の設定（環境別プロジェクト名、ビルド設定）
- `open-next.config.ts`: Next.js → Cloudflare Workers変換設定

#### 環境変数管理
- Cloudflare Dashboard経由で設定
- 必要な変数:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXTAUTH_SECRET`
  - `NEXTAUTH_URL`

### パフォーマンス最適化

1. **CPU制限**: 50ms（wrangler.jsonc）
2. **アセット最適化**: 静的ファイルの分離配信
3. **Node.js互換性**: nodejs_compat フラグ有効化
4. **監視**: observability 有効化

## 理由

### Cloudflare Workers選択理由

1. **グローバル配信**: エッジでの高速レスポンス
2. **コスト効率**: 従量課金モデル
3. **スケーラビリティ**: 自動スケーリング
4. **Next.js対応**: @opennextjs/cloudflare による良好なサポート
5. **Supabase連携**: 地理的に近いエッジからのAPI呼び出し

### 設定ファイル分離理由

- `wrangler.jsonc`: OpenNext preview用（開発時）
- `wrangler.toml`: Pages deploy用（本番デプロイ）
- 用途に応じた設定の最適化

## 影響

### 正の影響

1. **パフォーマンス向上**: グローバルエッジでの配信
2. **運用コスト削減**: サーバーレスアーキテクチャ
3. **開発効率**: プレビュー環境の簡単な構築
4. **スケーラビリティ**: トラフィック増加への自動対応

### 考慮事項

1. **CPU制限**: 50ms制限内での処理最適化が必要
2. **Cold Start**: 初回リクエスト時の遅延
3. **デバッグ**: ローカル環境との差異
4. **依存関係**: Node.js互換性の制約

## 実装状況

- ✅ 基本デプロイ設定完了
- ✅ staging/production環境分離
- ✅ プレビュー環境構築
- ✅ 環境変数設定
- ⏳ 本番デプロイ実行中

## 今後の課題

1. **監視・ログ**: Cloudflare Analytics/Logs の活用
2. **パフォーマンス**: Web Vitals の継続監視
3. **セキュリティ**: CSP/CORS設定の最適化
4. **BFF移行**: Phase 2でのHono BFF実装準備

## 参考資料

- [OpenNext Cloudflare Documentation](https://opennext.js.org/cloudflare)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)