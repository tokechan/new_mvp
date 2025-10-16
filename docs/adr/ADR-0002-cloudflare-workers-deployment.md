# ADR-0002: Cloudflare Pages デプロイメント戦略

## ステータス

承認済み（2025-01-22更新: WorkersからPagesへ移行完了）

## 日付

2024-12-22（初版）
2025-01-22（Pages移行対応）

## 背景

家事管理MVPアプリケーションのデプロイメント環境として、当初Cloudflare Workersを選択していたが、運用面での利便性とNext.jsアプリケーションの特性を考慮し、Cloudflare Pagesへの移行を実施した。

## 決定事項

### デプロイメント戦略

1. **プラットフォーム**: Cloudflare Pages（Workersから移行）
2. **ビルドツール**: Next.js標準ビルド + Cloudflare Pages
3. **環境分離**: staging と production の2環境
4. **設定管理**: wrangler.toml による統一管理

### 技術実装

#### デプロイスクリプト
```json
{
  "deploy:staging": "npm run build && npx wrangler pages deploy out --project-name=household-mvp-staging",
  "deploy:production": "npm run build && npx wrangler pages deploy out --project-name=household-mvp-production",
  "preview": "npm run build && npx wrangler pages dev out"
}
```

#### 設定ファイル構成
- `wrangler.toml`: Pages用の統一設定（環境別プロジェクト名、ビルド設定）
- `next.config.js`: Next.js静的エクスポート設定
- 削除済み: `wrangler.jsonc`, `open-next.config.ts`（Pages移行により不要）

#### 環境変数管理
- Cloudflare Dashboard経由で設定
- 必要な変数:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `SUPABASE_SECRET_KEY`
  - `NEXTAUTH_SECRET`
  - `NEXTAUTH_URL`

### パフォーマンス最適化

1. **静的サイト生成**: Next.js静的エクスポートによる高速配信
2. **アセット最適化**: Cloudflare CDNによる自動最適化
3. **キャッシュ戦略**: エッジキャッシュによる高速レスポンス
4. **監視**: Cloudflare Analytics による詳細な分析

## 理由

### Cloudflare Pages選択理由

1. **グローバル配信**: エッジでの高速レスポンス
2. **コスト効率**: 静的サイトホスティングによる低コスト
3. **スケーラビリティ**: 自動スケーリング
4. **Next.js対応**: 標準的な静的エクスポートによる安定性
5. **運用簡素化**: Workersの複雑な設定が不要
6. **Supabase連携**: クライアントサイドからの直接API呼び出し

### Pages移行理由

- **運用簡素化**: 複雑なWorkers設定からシンプルなPages設定へ
- **安定性向上**: Next.js標準機能による予測可能な動作
- **デバッグ容易性**: 静的サイトによる問題の特定しやすさ

## 影響

### 正の影響

1. **パフォーマンス向上**: グローバルエッジでの配信
2. **運用コスト削減**: サーバーレスアーキテクチャ
3. **開発効率**: プレビュー環境の簡単な構築
4. **スケーラビリティ**: トラフィック増加への自動対応

### 考慮事項

1. **静的サイト制約**: サーバーサイド処理の制限
2. **ビルド時間**: 静的生成による若干のビルド時間増加
3. **動的機能**: リアルタイム機能はクライアントサイドで実装
4. **API制限**: Supabaseクライアントの直接利用による制約

## 実装状況（2025-01-22更新）

- ✅ Pages移行完了
- ✅ staging/production環境分離
- ✅ 静的エクスポート設定完了
- ✅ 環境変数設定完了
- ✅ 本番デプロイ完了
- ✅ 認証問題解決

## 今後の課題

1. **監視・ログ**: Cloudflare Analytics の活用
2. **パフォーマンス**: Web Vitals の継続監視
3. **セキュリティ**: CSP/CORS設定の最適化
4. **BFF移行**: Phase 2でのHono BFF実装準備（Workers活用）

## 参考資料

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)