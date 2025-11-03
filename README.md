# TRAE Household Chore MVP

リアルタイムで家事を共有し「ありがとう」を送り合える家庭内タスクアプリの MVP 版です。  
Next.js 15（App Router）と Supabase をベースに、Cloudflare Pages 上にデプロイし、PWA / Push 通知の実験も行っています。

## 目次

1. [主な機能](#主な機能)
2. [技術スタックとディレクトリ](#技術スタックとディレクトリ)
3. [セットアップ](#セットアップ)
4. [Supabase とデータベース運用](#supabase-とデータベース運用)
5. [通知・PWA 設定](#通知pwa-設定)
6. [テストと品質管理](#テストと品質管理)
7. [デプロイと環境](#デプロイと環境)
8. [ドキュメント](#ドキュメント)
9. [トラブルシューティング](#トラブルシューティング)

---

## 主な機能

- **家事ボード** – 自分とパートナーの家事をリアルタイムに同期。未完了 10 件の制限付きで新規登録できます。
- **ありがとうメッセージ** – パートナーが完了させた家事にはハートボタンが表示され、その場で感謝メッセージを送信可能。
- **パートナー連携** – 招待コードベースでペアを組み、同じボードを共有。
- **通知センター** – Supabase Realtime を利用した完了通知・ありがとう通知をアプリ内で受信。
- **PWA / Push 実験** – フラグで切り替え可能な PWA 対応とプッシュ通知登録（BFF 経由）を用意。
- **アクセシビリティ** – WCAG 2.1 AA を目標に、スクリーンリーダー対応や自動テストを導入。

---

## 技術スタックとディレクトリ

| 区分 | 内容 |
| ---- | ---- |
| フロント | Next.js 15.5 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| BFF / API | Hono (`src/bff/app.ts`) + Supabase Edge Functions ではなく Cloudflare Workers 上で稼働 |
| データベース | Supabase Postgres + Auth + Realtime |
| インフラ | Cloudflare Pages / Workers, OpenNext for Cloudflare アダプタ |
| テスト | Playwright (E2E & a11y), Jest (Unit) |

主なディレクトリ:

- `src/app` … Next.js App Router のページ/レイアウト
- `src/components` … UI コンポーネント（家事カード、通知センター等）
- `src/hooks` … `useChores` / `useRealtime` など状態管理ロジック
- `src/services` … Supabase アクセス・Push購読・ThankYou送信などのドメインサービス
- `src/bff` … Cloudflare Worker 上で動く Hono ベースの API
- `supabase/migrations` … 本番にも適用している SQL マイグレーション
- `docs/reference` … アーキテクチャ、API、運用手順などの一次ドキュメント
- `scripts/` … 環境変数チェック、カバレッジモニタなどの補助スクリプト

---

## セットアップ

### 前提

- Node.js 22.x（Cloudflare Pages と揃えています）
- npm 10.x
- Supabase プロジェクト（既存: `njbormsqqfwnzwbigxuh`）
- （任意）Supabase CLI 2.54+ / psql クライアント

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数

`.env.example` を参考に `.env.local` を作成します。

```bash
cp .env.example .env.local
```

主要キー:

| 変数 | 説明 |
| ---- | ---- |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase プロジェクトの URL とパブリックキー |
| `SUPABASE_SECRET_KEY` | Service Role キー（ローカル開発のみで使用） |
| `NEXT_PUBLIC_ENABLE_PWA` | `true` で PWA/Service Worker を有効化 |
| `NEXT_PUBLIC_ENABLE_PUSH_SUBSCRIPTIONS` / `ENABLE_PUSH_SUBSCRIPTIONS` | Push 通知機能のフラグ |
| `NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY` | VAPID 公開鍵（Push を使う場合） |
| `NEXT_PUBLIC_BFF_URL` | Cloudflare Worker(BFF) の URL |

VAPID キー生成:

```bash
npm run push:vapid:generate
```

公開鍵を `.env.local`、秘密鍵を Cloudflare のシークレットに登録してください。

### 3. 開発サーバ

```bash
npm run dev
```

http://localhost:3000 が開発用 UI です。`NEXT_PUBLIC_SKIP_AUTH=true` の場合はモック認証モードで起動します。

---

## Supabase とデータベース運用

- プロジェクト Ref: `njbormsqqfwnzwbigxuh`
- 家事テーブルは RLS 有効。`SECURITY DEFINER` 関数とトリガーで家事上限（未完 10 件）を enforce。

### マイグレーション適用

CLI v2.54 には `supabase db remote execute` が無いため、`psql` で直接実行する運用です。

```bash
export DATABASE_URL="postgresql://postgres.njbormsqqfwnzwbigxuh:<service_role_password>@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"
psql "$DATABASE_URL" -f supabase/migrations/<timestamp>_*.sql
```

実行後に履歴テーブルを同期:

```bash
supabase migration repair <timestamp> --status applied
supabase migration list   # 状態確認（任意）
```

> 既に `applied` のエントリに再度 `--status applied` を流すと `duplicate key` になるので注意。

---

## 通知・PWA 設定

- ブラウザ通知は `src/contexts/NotificationContext.tsx` が管轄。Supabase Realtime の `chores` / `completions` / `thanks` を購読します。
- Push 通知はオプトイン機能です。`NEXT_PUBLIC_ENABLE_PUSH_SUBSCRIPTIONS` と `ENABLE_PUSH_SUBSCRIPTIONS` を有効化し、`/settings` 画面で「プッシュ通知を有効にする」を選択すると BFF (`src/bff/app.ts`) 経由で `push_subscriptions` テーブルへ登録します。
- PWA を有効にした場合は Service Worker のキャッシュが残るため、リリース後に挙動が変わらない場合は「キャッシュ削除 → 再読込」や `skipWaiting()` の実行を推奨します。

---

## テストと品質管理

| 種別 | コマンド |
| ---- | -------- |
| Lint | `npm run lint` |
| Unit | `npm run test:unit` |
| E2E（Playwright） | `npm run test:e2e` |
| a11y チェック | `npm run test:accessibility` |
| カバレッジ収集 | `npm run test:coverage` |
| カバレッジ監視 | `npm run test:monitor[:watch|:analyze]` |
| RLSテスト用環境ファイル生成 | `npm run test:rls:prepare` |

Playwright レポートは `npm run test:e2e` 後に `npx playwright show-report` で確認できます。

`scripts/check-jwt-expiration.mjs` は JWT の有効期限チェックに利用できます。トークンを引数または `JWT_TOKEN` 環境変数で渡して実行してください。`test-rls-policies.html` をブラウザで開く前に、`TEST_RLS_SUPABASE_URL` / `TEST_RLS_SUPABASE_ANON_KEY` を設定し `npm run test:rls:prepare` を実行して `test-rls-policies.env.js` を生成します。コミット前のシークレット検出には `pre-commit install` を実行して `.pre-commit-config.yaml` の gitleaks フックを有効化します。

---

## デプロイと環境

- **Cloudflare Pages**  
  - Staging: `household-mvp-staging`  
  - Production: `household-mvp-production`
- ビルドは OpenNext Cloudflare アダプタを利用:

```bash
# Preview
npm run preview

# Deploy (環境指定)
npm run deploy:staging
npm run deploy:production
```

Cloudflare Workers に直接上げたい場合は `npx wrangler deploy --env <env>` も利用可能です。

GitHub 連携で自動ビルドする場合でも、PWA のキャッシュ更新が必要なときは端末側でのリロードを忘れないでください。

---

## ドキュメント

`docs/reference` 以下に一次情報を集約しています。

- `architecture.md` – C4 ライト図とモジュール責務
- `api.md` / `openapi.yaml` – BFF API の仕様
- `data-migrations.md` – マイグレーション運用ポリシー
- `performance.md`, `monitoring.md`, `operations-runbook.md` – 本番運用関連
- `pwa-push-notifications.md` – Push / VAPID のセットアップ詳細
- `ui-wireframes.md` – 主要画面の UX メモ

最新の整理済みドキュメントは `docs/reference/index.md` を入口に参照してください。

---

## トラブルシューティング

- **PWA で更新が反映されない**  
 端末のキャッシュを削除するか、DevTools の “Update on reload” を有効化して Service Worker を更新。

- **Supabase CLI が `--file` を受け付けない**  
 v2.54.x では `supabase db remote execute` に `--file` オプションが存在しません。上記の `psql` 手順を利用してください。

- **完了ハートが表示されない**  
 直近の完了者情報を `completions` テーブルで管理しています。`completions` の RLS / Realtime が無効化されていないか確認してください。

- **Playwright テストが遅い**  
 `npm run test:e2e:fast` で a11y チェックをスキップした軽量モードを用意しています。

---

### メンテナンスノート

- ESLint では `ThankYouCelebration.tsx` と `useRealtime.ts` に既知の Hook warning が存在します（動作に影響は無いが要整理）。
- 依存パッケージに deprecated 表示が出る場合は `npm audit` で随時確認してください（Cloudflare Pages のログ参照）。

---

何か追加したい情報や不要な項目があればお知らせください。README は随時アップデートしていきます。***
