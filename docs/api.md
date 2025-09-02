# API 概要

MVPで使う主要エンドポイント。詳細仕様は [openapi.yaml](./openapi.yaml)。

## エンドポイント一覧（概要）
- POST `/chores` — 家事作成
- GET  `/chores` — 家事一覧（自分 or ペア相手分のみ / RLS）
- PATCH `/chores/{id}` — 完了更新（done=true）
- POST `/completions` — 完了履歴の作成
- POST `/thanks` — ありがとう送信
- GET  `/me` — 自分情報

## 使用例（curl）
```sh
# 家事の作成
curl -X POST "$API/chores" \
 -H "Authorization: Bearer $TOKEN" \
 -d '{"title":"皿洗い","partner_id":"<uuid>"}'

# 完了→通知
curl -X PATCH "$API/chores/123" \
 -H "Authorization: Bearer $TOKEN" \
 -d '{"done":true}'
```