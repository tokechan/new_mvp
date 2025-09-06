# API概要

## 認証
- Supabase Auth（Email Link / Google OAuth）
- JWT Bearer Token
- RLS（Row Level Security）でDB側セキュリティ強制

## データアクセス（Supabase直接）

### 家事管理（chores）
```javascript
// 家事作成
await supabase.from('chores').insert({
  owner_id: user.id,           // RLSでauth.uid() = user.idチェック
  partner_id: partnerId ?? null,
  title: 'お皿洗い'
});

// 家事一覧取得（自分がowner or partnerのもののみ）
const { data } = await supabase
  .from('chores')
  .select('*')
  .order('id', { ascending: false });

// 完了登録（doneフラグ更新 + completionsへINSERT）
await supabase.from('chores')
  .update({ done: true })
  .eq('id', choreId);

await supabase.from('completions').insert({
  chore_id: choreId,
  user_id: user.id             // RLS: user本人しか挿せない
});
```

### ありがとう送信（thanks）
```javascript
// ありがとう送信
await supabase.from('thanks').insert({
  from_id: user.id,
  to_id: partnerId,
  message: '今日もありがとう！'
});

// ありがとう履歴取得
const { data } = await supabase
  .from('thanks')
  .select('*')
  .order('created_at', { ascending: false });
```

## Realtime（リアルタイム通知）

```javascript
// 完了イベント監視
export const listenCompletions = (onNew: (row: any) => void) => {
  return supabase
    .channel('completions-feed')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'completions'
    }, (payload) => onNew(payload.new))
    .subscribe();
};

// ありがとう受信監視
export const listenThanks = (onNew: (row: any) => void) => {
  return supabase
    .channel('thanks-feed')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'thanks'
    }, (payload) => onNew(payload.new))
    .subscribe();
};
```

## 将来のBFF拡張

Phase 2でCloudflare Workers（Hono）を追加予定：
- 署名付きR2 URL発行
- 外部API結合
- 集計/レポートのキャッシュ（KV/Cache API）
- SupabaseのJWT検証（JWKS使用）