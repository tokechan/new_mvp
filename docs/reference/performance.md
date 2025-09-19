# パフォーマンス

## 目標値
- Web: LCP < 2.5s / CLS < 0.1 / INP < 200ms
- API: P50 < 300ms / エラー率 < 1%
- Realtime: 通知遅延 < 2s

## 実装メモ
- 画像: 遅延読込 / サイズ最適化
- DB: インデックス（chores(owner_id, done), completions(chore_id, created_at)）
- キャッシュ: 一覧はSWR / 後でBFF（Workers）で強化

## 計測
- Cloudflare Analytics / Web Vitals / Supabase Logs