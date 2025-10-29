# 未参照ファイル・フォルダ調査レポート

本レポートは、次の観点でプロジェクト内の未参照候補を特定しています。

- ディレクトリ全走査によるメタ情報収集（`reports/file_inventory.csv`, `reports/dir_inventory.csv`）
- TypeScriptコンパイル対象（`tsc --listFiles`）および限定的なコード検索による参照確認
- ビルド・デプロイ設定（`package.json` スクリプト、`wrangler.toml`、`scripts/`）の確認
- 間接的使用（テスト、開発用スクリプト、CLI設定、ドキュメント）の評価

## 判定基準（削除の安全性）

- ランタイム参照なし: コードから `import`/`require`/動的読み込みの痕跡がない。
- ビルド/デプロイ設定非参照: ビルド、アセット生成、デプロイ設定で直接指定されていない。
- 間接用途の明確化: テスト・ドキュメント・CLI用設定など、実行時不要だが開発時に有用な場合は「任意削除」。
- 実ファイル状態: サイズ、最終更新日時、格納内容（空/テンポラリ）を考慮。

## 未参照候補一覧

> 注: メタデータは `reports/file_inventory.csv` と `reports/dir_inventory.csv` から取得しています。

### 1) `src/styles/responsive.css`

- 参照状況: `src/app/globals.css` では `animations.css` のみが `@import` されており、`responsive.css` の参照は検出できず（限定的grepで未検出）。
- 用途想定: レスポンシブ用のユーティリティ/コンポーネントCSSだが現状未使用。
- メタ情報（抜粋）: `path=./src/styles/responsive.css`, `size=9314` Bytes, `modified=2025-10-17 11:59:18`（ローカルタイムスタンプ）
- 判定: 任意削除（影響小）。削除前に以下の検証を推奨。
  - `grep -R "responsive.css" src/` で最終確認。
  - ローカル起動し主要画面を目視確認（CSSの崩れがないか）。

### 2) `components.json`

- 参照状況: ランタイム/ビルドからの直接参照なし。`shadcn/ui` 等のコンポーネントジェネレータの設定ファイルである可能性が高い。
- 用途想定: 開発時のCLI設定のみ。
- メタ情報（抜粋）: `path=./components.json`, `size=469` Bytes, `modified=2025-10-17 11:59:18`
- 判定: 任意削除（開発補助のみ）。ジェネレータを今後使う予定がなければ削除可。

### 3) `supabase/.temp`（ディレクトリ）

- 参照状況: アプリ実行時/ビルドでは不要。`supabase` CLIが一時生成するテンポラリの可能性が高い。
- 内容量: `items=7`, `size=28K`
- 判定: 安全に削除可能。必要時にCLIが再生成します。

### 4) `types`（リポジトリ直下のディレクトリ）

- 参照状況: 空ディレクトリ（`items=0`, `size=0B`）。
- 判定: 安全に削除可能。

### 5) `docs`（ドキュメント）

- 参照状況: デプロイ/ビルドからの参照なし。`docs/reference/` でガイドや仕様説明を保持。
- 内容量: `items=47`, `size=288K`
- 判定: 任意削除（プロダクト動作には不要）。チーム運用上保持を推奨。

## 参照が確認された主なリソース（削除非推奨）

- `public/manifest.json`: `src/app/layout.tsx` および `public/_headers` から参照。
- `public/sw.js`: `src/components/PwaInitializer.tsx` から登録される Service Worker。
- `public/_headers`: 静的ヘッダ設定（デプロイ配信設定に影響）。
- `worker/index.js`: `wrangler.toml` の `main` に指定（Cloudflare Workerのエントリ）。

## 推奨削除手順（安全なクリーンアップ）

1. ブランチを切る: 誤削除に備えて `git checkout -b chore/cleanup-unused`。
2. 候補の削除:
   - `rm src/styles/responsive.css`
   - `rm components.json`
   - `rm -rf supabase/.temp`
   - `rmdir types`（空の場合）
   - `docs` は必要に応じて保持/アーカイブ。
3. 確認:
   - `npm run build`（もしくは `next build`）でビルド通過確認。
   - `npm test` があれば実行。
   - `npm run dev` で主要画面の目視確認。

## 今後の追加確認（任意）

- 全面インポート解析: `ripgrep` による広範囲検索（`node_modules` 等を除外）で参照網を完全把握。
- バンドルサイズ比較: 削除前後で `.next`/`.open-next` 生成物のサイズを比較し効果測定。
- CI/デプロイ: パイプライン上でのビルド/デプロイ成功確認。

---

このレポートは、現時点のファイル在庫・限定的コード検索・設定確認に基づいています。運用フローに応じて、追加の自動解析スクリプト（広域 `rg` 検索や依存グラフ生成）を導入することで、さらに確実性を高められます。