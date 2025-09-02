# 監視とログ

## メトリクス
- リクエスト数 / エラー率 / レイテンシP50/P95
- Realtimeイベント数 / 失敗数

## ログ（構造化）
- event: "chore_created" | "chore_completed" | "thanks_sent"
- user_id / pair_id / chore_id / timestamp
- level: info | warn | error

## アラート基準（例）
- エラー率 > 2%（5分平均） → Slack通知
- P95 > 1.5s が10分継続 → 注意喚起