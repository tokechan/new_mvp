# セキュリティチェックリスト

## 環境変数管理のセキュリティ対策

### ✅ 実装済み対策

1. **`.gitignore`設定**
   - `.env`ファイルの除外
   - `.open-next/`フォルダの除外
   - ビルド成果物の除外

2. **`.env.example`の適切な管理**
   - 実際の認証情報を削除
   - プレースホルダーに置き換え
   - 設定方法の明記

3. **Git追跡の確認**
   - 機密情報を含むファイルがGitに追跡されていないことを確認済み

### 🔧 追加推奨対策

#### 1. 環境変数の検証
```bash
# 開発環境で必要な環境変数が設定されているかチェック
npm run env-check
```

#### 2. pre-commitフックの設定
```bash
# .env ファイルや機密情報の誤コミットを防ぐ
npm install --save-dev husky
npx husky add .husky/pre-commit "npm run security-check"
```

#### 3. Cloudflareでの環境変数設定
```bash
# 本番環境では必ずCloudflareダッシュボードで設定
wrangler secret put NEXT_PUBLIC_SUPABASE_URL
wrangler secret put NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
wrangler secret put SUPABASE_SECRET_KEY
wrangler secret put NEXTAUTH_SECRET
```

#### 4. Supabaseキー移行履歴 (2025年1月)
**✅ 完了済み: 新しいAPI仕様への移行**
- 旧キー形式から新キー形式への移行完了
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` → `SUPABASE_SECRET_KEY`
- 更新対象ファイル:
  - ✅ `.env` / `.env.example`
  - ✅ `src/lib/supabase.ts`
  - ✅ `scripts/check-env.js`
  - ✅ `scripts/setup-env.sh`
  - ✅ `jest.setup.js`
  - ✅ `wrangler.toml`
  - ✅ `.open-next/cloudflare/next-env.mjs` (ビルド再生成)

#### 5. 定期的なセキュリティ監査
- [ ] 月1回: `.gitignore`の設定確認
- [ ] デプロイ前: 環境変数の漏洩チェック
- [ ] 新メンバー参加時: セキュリティガイドラインの共有

### ⚠️ 注意事項

1. **絶対にやってはいけないこと**
   - `.env`ファイルをGitにコミット
   - 認証情報をコードに直接記述
   - 本番環境の認証情報を開発環境で使用

2. **緊急時の対応**
   - 認証情報が漏洩した場合は即座にSupabaseで無効化
   - 新しい認証情報を生成して再設定
   - 影響範囲の調査と報告

### 🔍 チェックコマンド

```bash
# 機密情報の漏洩チェック
git log --all --full-history -- .env*
git log --all --full-history -- "**/next-env.mjs"

# 現在のGit追跡状況確認
git status --ignored | grep -E "\.env|\.open-next"
```

## 関連ドキュメント

- [環境変数設定ガイド](../README.md#環境変数の設定)
- [Cloudflareデプロイガイド](./cloudflare-deployment-issues.md)
- [セキュリティポリシー](./reference/security.md)