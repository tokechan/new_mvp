# 運用ランブック

## デプロイメント

### Cloudflare Workers デプロイ

#### 環境
- **Staging**: `household-mvp-staging`
- **Production**: `household-mvp`

#### デプロイコマンド
```bash
# Staging環境
npm run deploy:staging

# Production環境
npm run deploy:production

# ローカルプレビュー
npm run preview
```

#### 環境変数確認
```bash
# 設定確認
wrangler pages secret list --project-name=household-mvp-staging

# 設定追加
wrangler pages secret put VARIABLE_NAME --project-name=household-mvp-staging
```

#### ログ確認
```bash
# リアルタイムログ
wrangler pages deployment tail --project-name=household-mvp-staging

# 分析データ
wrangler analytics
```

#### ロールバック
```bash
# デプロイ履歴確認
wrangler pages deployment list --project-name=household-mvp

# 特定バージョンへロールバック
wrangler pages deployment promote <deployment-id> --project-name=household-mvp
```

## 障害対応

### 優先度
- P0: 主要機能が使えない
- P1: 一部ユーザーに影響
- P2: 軽微

### 連絡
- まずはREADMEのステータスバッジ/トップに告知
- 影響範囲・暫定対応・次報予定を明記

### 切り分け手順
1) Cloudflare Workers ダッシュボードのメトリクス確認
2) Supabase ステータス / ログ確認  
3) フロントのデグレ（直近PR）確認
4) CPU制限（50ms）超過の確認

### 一時対応
- 読み取り専用モード（一覧のみ表示）へ落とす
- 直近デプロイのロールバック
- Cloudflare Workers の一時停止

### 事後
- ポストモーテム（原因/対応/再発防止）