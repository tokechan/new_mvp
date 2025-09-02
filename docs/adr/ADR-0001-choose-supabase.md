# ADR-0001: Choose Supabase for Auth/DB/Realtime

- 日付: 2025-09-01
- ステータス: 承認

## 背景
認証/RLS/Realtimeを自作するとMVPの速度が落ちる。BaaSの採用を検討。

## 決定
Supabase を採用し、Auth/RLS/Realtime/Storage（少量）を利用。フロントはNext.js（Pages）。

## 影響
- 初速が大幅向上
- 将来的に配信負荷増の場合、StorageをR2へ移行（URL抽象で吸収）
- BFF（Workers）は段階的に導入し、SDK薄ラッパを置換