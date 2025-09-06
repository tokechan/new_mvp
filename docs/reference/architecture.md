# Architecture (C4-Lite)

## 目的（1行）
Supabase の Auth/RLS/Realtime を活用し、Cloudflare Pages 上の Next.js から最短で価値提供。

## コンテキスト（Context）
- 利用者: 夫婦/カップル
- 目的: 家事の可視化と「ありがとう」コミュニケーション

## コンテナ（Container）
- フロント: Next.js (Cloudflare Pages)
- バックエンド/BaaS: Supabase (Auth / Postgres / RLS / Realtime / Storage)
- 将来のBFF: Cloudflare Workers (Hono) — 署名URL/集計/外部API

## 責務境界
- UI/UX: 表示・入力・ルーティング
- Data Access: Supabase SDK の薄ラッパ（後にBFFへ置換可能）
- 認可: **DB側のRLSで強制**（アプリは漏れ防止の最小ロジックのみ）

## データフロー（Sequence）
1. ユーザーが家事を追加 → `POST /chores`（Supabase insert）
2. 完了登録 → `update chores.done=true` + `insert completions`
3. Realtime が相手へイベント配信 → フロントでバナー表示
4. 「ありがとう」送信 → `insert thanks` → 相手へイベント

## 非機能の要点
- 性能: P50 API < 300ms / LCP < 2.5s
- セキュリティ: RLS必須 / OWASP Top10基礎 / CSP
- 可搬性: SQLは標準Postgres寄り、画像URL抽象化（将来R2へ）

## 将来拡張
- 画像/動画が増えたら R2 + 署名URL
- 集計/レポートは Workers(BFF) でキャッシュ化