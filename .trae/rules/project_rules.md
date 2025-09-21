# プロジェクト規範 (Project Rules)

## 基本方針

### プロジェクト概要
- **目的**: 夫婦/カップル向け家事管理アプリ（MVP）
- **技術スタック**: Next.js 15 + Supabase + Cloudflare Workers
- **設計思想**: 最短での価値提供、段階的拡張可能性、アクセシビリティファースト

### ドキュメント駆動開発
1. このプロジェクトは `docs/reference/**.md` ファイルを基盤とする
2. 新機能追加時は対応するドキュメントを先に更新する
3. 重要な技術決定は ADR（Architecture Decision Record）として記録する
4. ERDとRLSポリシーは常に最新状態を維持する

## アーキテクチャ規範

### 技術スタック
- **フロントエンド**: Next.js 15.5.2 (TypeScript, App Router)
- **UI**: Radix UI + Tailwind CSS + shadcn/ui
- **バックエンド/BaaS**: Supabase (Auth/Postgres/RLS/Realtime/Storage)
- **デプロイ**: Cloudflare Workers
- **将来拡張**: Cloudflare Workers (Hono) for BFF

### 責務分離
- **UI/UX**: 表示・入力・ルーティング・アクセシビリティ
- **Data Access**: Supabase SDK の薄ラッパ（Service層で抽象化）
- **認可**: DB側のRLSで強制（アプリは漏れ防止の最小ロジックのみ）
- **状態管理**: React Context + Custom Hooks

### データベース設計
- **RLS必須**: 全テーブルでRow Level Securityを有効化
- **型安全性**: TypeScript型定義をSupabaseスキーマと同期
- **インデックス**: パフォーマンス要件に基づき適切に設定
- **テーブル**: profiles, chores, completions, thanks

## 開発規範

### コーディング標準
1. **TypeScript必須**: 型安全性を最優先
2. **ESLint**: `next/core-web-vitals` + `jsx-a11y` 設定を使用
3. **命名規則**: 意味のある説明的な名前を使用
4. **関数**: 単一責任の原則、早期リターンでネストを避ける
5. **コメント**: 「なぜ」を説明、「何を」は避ける
6. **アクセシビリティ**: WCAG 2.1 AA基準への準拠を必須とする

### ファイル構成
```
src/
├── app/          # Next.js App Router（ページ・レイアウト・API）
├── components/   # 再利用可能なUIコンポーネント
│   ├── ui/       # shadcn/ui基盤コンポーネント
│   └── __tests__ # コンポーネントテスト
├── contexts/     # React Context（認証・通知など）
├── hooks/        # カスタムフック（状態管理・副作用）
├── services/     # データアクセス層（Supabase薄ラッパ）
├── lib/          # ユーティリティ・設定
├── types/        # 型定義
└── utils/        # ヘルパー関数
```

### アクセシビリティ規範
1. **キーボードナビゲーション**: 全機能をキーボードで操作可能
2. **スクリーンリーダー**: 適切なARIA属性とセマンティックHTML
3. **フォーカス管理**: モーダル・フォームでの適切なフォーカス制御
4. **色・コントラスト**: WCAG AA基準のコントラスト比を維持
5. **動的コンテンツ**: 状態変更時の適切なアナウンス

### Supabase利用規範
1. **認証**: Email Link または Google OAuth
2. **データアクセス**: 直接Supabaseクライアント使用（BFF移行まで）
3. **Realtime**: 適切なフィルタリングで購読
4. **型定義**: Database型をsupabase.tsで管理

## セキュリティ規範

### 認証・認可
- Supabase Auth使用、JWT Bearer Token
- **RLS強制**: アプリ側のWHERE漏れをDBが拒否
- プロフィール存在確認（RLS前提条件）

### Webアプリ対策
- **XSS**: 出力エスケープ、HTML入力禁止、ライブラリsanitization
- **CSRF**: 同ドメインPOST設計（BFF導入時はCSRFトークン）
- **CORS**: 必要最小のオリジンのみ許可
- **CSP**: `default-src 'self';` を基本に段階的導入

### 環境変数管理
- `.env` はGit管理外、`.env.example` を整備
- 公開鍵以外はCloudのSecret管理を優先
- 週次で `npm audit` / Dependabot 監視

## 品質基準

### パフォーマンス目標
- **Web**: LCP < 2.5s / CLS < 0.1 / INP < 200ms
- **API**: P50 < 300ms / エラー率 < 1%
- **Realtime**: 通知遅延 < 2s

### 実装要件
- 画像: 遅延読込・サイズ最適化
- キャッシュ: 一覧はSWR、後でBFF（Workers）で強化
- インデックス: `chores(owner_id, done)`, `completions(chore_id, created_at)`

### テスト要件
1. **E2Eテスト**: Playwright使用、主要導線（追加→完了→通知→ありがとう）を必須カバー
2. **アクセシビリティテスト**: axe-core使用、WCAG 2.1 AA基準への自動チェック
3. **ユニットテスト**: Jest + Testing Library、コンポーネント・フック・サービス層
4. **テスト環境**: 認証スキップ機能（NEXT_PUBLIC_SKIP_AUTH=true）
5. **ブラウザ対応**: Chromium, Firefox, WebKit での動作確認
6. **リファクタリング**: 十分なテストカバレッジ後に小さなステップで実行

## 運用規範

### リリース基準
- [ ] 主要導線（追加→完了→通知→ありがとう）をE2Eで緑
- [ ] アクセシビリティテスト（axe-core）で違反ゼロ
- [ ] 全ブラウザ（Chromium/Firefox/WebKit）でテスト通過
- [ ] 404 / OGP / SEO最低限 / フォーム検証
- [ ] 環境変数の最終確認 / バックアップ存在
- [ ] RLSポリシーの動作確認
- [ ] Realtime機能の動作確認
- [ ] 変更点/移行手順/既知の問題をリリースノートに記載
- [ ] 監視ダッシュボード公開 / アラート閾値設定

### 監視・計測
- Cloudflare Analytics / Web Vitals / Supabase Logs
- パフォーマンス劣化の早期検知
- エラー率・レスポンス時間の継続監視

### データ管理
- マイグレーション運用の文書化
- RLSポリシーのSQL管理
- バックアップ・復旧手順の整備

## 将来拡張方針

### Phase 2: BFF導入
- Cloudflare Workers (Hono) でBFF構築
- 署名付きR2 URL発行
- 外部API結合・集計/レポートのキャッシュ化
- SupabaseのJWT検証（JWKS使用）

### 可搬性確保
- SQLは標準Postgres寄り
- 画像URL抽象化（将来R2へ移行対応）
- SDK薄ラッパでBFF移行を容易に

## 変更管理

### ドキュメント更新
1. 機能変更時は対応するdocs/reference/**.mdを更新
2. データベーススキーマ変更時は `docs/erd.md` と `docs/rls-policies.sql` を更新
3. 重要な技術決定は新しいADRとして記録

### コードレビュー
- リファクタリング後の品質確認
- セキュリティ観点でのチェック
- パフォーマンス影響の評価
- アクセシビリティ要件の確認

## 現在の実装状況

### 実装済み機能
1. **認証システム**: Supabase Auth（Google OAuth対応）
2. **家事管理**: CRUD操作、完了状態管理
3. **リアルタイム通知**: Supabase Realtime使用
4. **ありがとうメッセージ**: パートナー間コミュニケーション
5. **パートナー招待**: 招待リンク機能
6. **アクセシビリティ**: キーボードナビゲーション、スクリーンリーダー対応

### 技術実装詳細
- **状態管理**: AuthContext, NotificationContext
- **データアクセス**: Service層（ChoreService, AuthService等）
- **UI コンポーネント**: shadcn/ui + Radix UI
- **カスタムフック**: useAuth, useChores, useRealtime等
- **テスト**: Playwright E2E + Jest ユニット + axe-core アクセシビリティ

### 開発環境
- **Node.js**: 18+
- **パッケージマネージャー**: npm
- **開発サーバー**: Next.js dev server (localhost:3000)
- **テストサーバー**: Playwright用 (localhost:3001)
- **環境変数**: .env.example参照
