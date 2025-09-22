# 家事管理MVP - Cloudflare Pages デプロイ済み

## 🚀 デプロイ状況

- **プラットフォーム**: Cloudflare Pages
- **Staging**: `household-mvp-staging` (デプロイ完了)
- **Production**: `household-mvp-production` (デプロイ完了)
- **技術スタック**: Next.js 15 + Supabase + TypeScript

## 📋 クイックスタート

```bash
# 開発環境
npm run dev

# テスト実行
npm run test:e2e
npm run test:unit

# デプロイ
npm run deploy:staging
npm run deploy:production

# プレビュー
npm run preview
```

## 📚 ドキュメント構成

```text
docs/
├─ index.md                 # ドキュメントの入口（目次）
├─ architecture.md          # C4-Lite構成/責務/データフロー
├─ erd.md                   # ER図（Mermaid or 画像リンク）
├─ api.md                   # API概要と使用例（OpenAPIへの導線）
├─ openapi.yaml             # 最小のOpenAPI定義
├─ data-migrations.md       # マイグレーション運用の約束
├─ rls-policies.sql         # RLSポリシー（Postgres/Supabase）
├─ security.md              # セキュリティ基本方針＆チェック
├─ performance.md           # パフォーマンス目標＆計測方法
├─ monitoring.md            # 監視/ログ/アラート運用
├─ operations-runbook.md    # 運用ランブック（デプロイ・障害対応）
├─ ui-wireframes.md         # 主要画面のワイヤー&ユーザーフロー
├─ glossary.md              # 用語集（Single Source of Truth）
├─ checklist-release.md     # ローンチ/リリースチェックリスト
└─ adr/
   ├─ ADR-0001-choose-supabase.md      # Supabase選択の記録
   └─ ADR-0002-cloudflare-workers-deployment.md  # CF Workers デプロイ戦略
```

## 🔧 技術仕様

- **フロントエンド**: Next.js 15.5.2 (App Router)
- **バックエンド**: Supabase (Auth/Postgres/RLS/Realtime)
- **デプロイ**: Cloudflare Pages (静的エクスポート)
- **UI**: Radix UI + Tailwind CSS + shadcn/ui
- **テスト**: Playwright (E2E) + Jest (Unit) + axe-core (a11y)
- **型安全性**: TypeScript + Zod

## 📊 プロジェクト状況

### ✅ 実装完了
- 認証システム (Supabase Auth + Google OAuth)
- 家事管理 (CRUD + リアルタイム更新)
- ありがとうメッセージ機能
- パートナー招待システム
- アクセシビリティ対応 (WCAG 2.1 AA)
- E2E/Unit/a11y テスト
- Cloudflare Pages デプロイ設定

### 🔄 進行中
- 監視・ログ設定
- パフォーマンス最適化

### 📋 今後の予定
- 監視・ログ設定
- パフォーマンス最適化
- Phase 2: BFF (Hono) 導入
