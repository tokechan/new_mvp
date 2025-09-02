# データマイグレーション運用

## 命名規則
`YYYYMMDDHHmm__<summary>.sql` 例: `20250901_1030__add_completions.sql`

## 手順（Supabase）
1. SQL作成 → `supabase db push` で適用  
2. PRに SQL を含める（ERD更新があれば画像/mermaidも更新）  
3. リリースノートに「スキーマ変更」を明記（後方互換かどうか）

## ロールバック
- 基本は前方互換を守る（破壊的変更は段階的に）
- どうしてもの時は `DROP/ALTER` を明示し、バックアップから復元手順を併記