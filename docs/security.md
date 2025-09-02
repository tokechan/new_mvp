# セキュリティ方針（MVP）

## 認証/認可
- Supabase Auth（Email Link or Google）
- **RLS強制**（アプリ側のWHERE漏れをDBが拒否）

## Webアプリ対策
- XSS: 出力エスケープ / HTML入力禁止 / ライブラリ sanitization
- CSRF: 同ドメインPOST設計（BFF導入時はCSRFトークン）
- CORS: 必要最小のオリジンのみ許可
- CSP: `default-src 'self';` を基本に段階的導入

## シークレット/ENV
- `.env` はGit管理外 / `.env.example` を整備
- 公開鍵以外はCloudのSecret管理を優先

## 依存パッケージ
- 週次で `npm audit` / Dependabot を監視