# PKCE認証エラー解決記録

## 📅 日付
2025年10月07日

## 🚨 問題の概要
Google OAuth認証時に以下のエラーが継続的に発生：
```
PKCE コード交換エラー: AuthApiError: invalid request: both auth code and code verifier should be non-empty
```

## 🔍 原因分析

### 1. 主要な問題
- **複雑すぎるPKCE手動実装**: 独自のcode verifier管理とローカルストレージ操作
- **Supabaseの標準フローとの不整合**: 最新のSupabase実装に合わない古いアプローチ
- **デバッグログの不足**: 実際の実行フローが見えない状態

### 2. 技術的な詳細
- `exchangeCodeForSession`の手動実装が不適切
- ローカルストレージでのPKCEパラメータ管理が複雑化
- URLパラメータの解析処理が冗長

## 🛠️ 解決策

### 1. コールバックページの簡潔化
**変更前**: 複雑な手動PKCE処理
```typescript
// 複雑なURLパラメータ解析
// 手動のcode verifier管理
// ローカルストレージの直接操作
```

**変更後**: Supabaseの自動処理を活用
```typescript
// getSession()による自動PKCE処理
// フォールバックとしてexchangeCodeForSession()
// シンプルなエラーハンドリング
```

### 2. 認証サービスの標準化
- 余分なPKCEログを削除
- Supabaseの標準OAuth設定に統一
- 不要な環境変数チェックを削除

### 3. 修正されたファイル
- `src/app/auth/callback/page.tsx` - コールバック処理の簡潔化
- `src/features/auth/services/authService.ts` - 認証サービスの標準化

## ✅ 解決結果
- Google認証が正常に動作
- PKCEエラーが完全に解消
- より保守しやすいコードベース

## 📚 学んだこと

### 1. Supabaseのベストプラクティス
- 複雑な手動実装よりも、Supabaseの標準機能を信頼する
- `getSession()`は内部でPKCE処理を自動実行する
- 過度なカスタマイズは問題の原因になりやすい

### 2. デバッグのアプローチ
- 段階的なログ追加でフローを可視化
- 問題の根本原因を特定してから修正
- シンプルな解決策を優先する

### 3. コード品質
- 複雑さを避け、可読性を重視
- フレームワークの標準に従う
- 必要最小限の実装に留める

## 🔄 今後の改善点
- 認証フローのテストケース追加
- エラーハンドリングの更なる改善
- ユーザーエクスペリエンスの向上

## 📝 参考資料
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [OAuth 2.0 PKCE Specification](https://tools.ietf.org/html/rfc7636)