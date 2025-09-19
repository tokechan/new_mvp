# Supabase Realtime - Postgres Changes 実装ガイド

## 概要

Supabase Realtime の Postgres Changes 機能を使用してリアルタイムデータ同期を実装する際のトラブルシューティングガイドとベストプラクティス集。

**対象**: Next.js + TypeScript + Supabase での実装

## 🎯 実装目標

- データベースの INSERT/UPDATE/DELETE をリアルタイムでクライアントに配信
- 複数ブラウザ間でのデータ同期
- 適切なフィルタリングによるセキュリティ確保

## 📋 前提条件チェックリスト

### 1. Database 設定

#### ✅ REPLICA IDENTITY の設定
```sql
-- テーブルの REPLICA IDENTITY を FULL に設定（必須）
ALTER TABLE your_table REPLICA IDENTITY FULL;

-- 確認方法
SELECT schemaname, tablename, relreplident 
FROM pg_class 
JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid 
JOIN pg_publication_tables ON pg_class.relname = pg_publication_tables.tablename 
WHERE pg_publication_tables.pubname = 'supabase_realtime';
-- relreplident が 'f' (FULL) である必要がある
```

#### ✅ Publication 設定
```sql
-- Publication の操作種別を確認
SELECT pubname, pubinsert, pubupdate, pubdelete 
FROM pg_publication 
WHERE pubname = 'supabase_realtime';

-- すべて true である必要がある
-- 修正が必要な場合
ALTER PUBLICATION supabase_realtime SET (publish = 'insert,update,delete');

-- テーブルが Publication に含まれているか確認
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```

### 2. RLS (Row Level Security) 設定

```sql
-- RLS が有効になっているか確認
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'your_table';

-- RLS ポリシーの確認
\dp your_table
```

### 3. Supabase Dashboard 確認

- **Database** → **Publications** で `supabase_realtime` の設定確認
- **Database** → **Realtime** → **Inspector** でイベント送信状況を監視

## 🔧 クライアント実装

### 基本実装パターン

```typescript
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type YourDataType = {
  id: string
  owner_id: string
  partner_id: string | null
  // その他のフィールド
}

export function useRealtimeData(userId: string) {
  const [data, setData] = useState<YourDataType[]>([])
  const [realtimeEvents, setRealtimeEvents] = useState({
    inserts: 0,
    updates: 0,
    deletes: 0,
    connectionStatus: 'unknown' as 'connected' | 'disconnected' | 'error' | 'unknown'
  })

  useEffect(() => {
    if (!userId) return

    // 初期データ取得
    const fetchData = async () => {
      const { data: initialData, error } = await supabase
        .from('your_table')
        .select('*')
        .or(`owner_id.eq.${userId},partner_id.eq.${userId}`)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('データ取得エラー:', error)
        return
      }
      setData(initialData || [])
    }

    fetchData()

    // Realtime 購読設定
    const channel = supabase
      .channel(`your-table-${userId}-${Date.now()}`)
      // INSERT イベント
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'your_table',
        filter: `owner_id=eq.${userId}` // サーバ側フィルタ
      }, (payload) => {
        console.log('🟢 INSERT EVENT:', payload)
        const newItem = payload.new as YourDataType
        
        // クライアント側フィルタリング（追加の安全性）
        if (newItem && (newItem.owner_id === userId || newItem.partner_id === userId)) {
          setData(prev => {
            // 重複チェック
            const exists = prev.some(item => String(item.id) === String(newItem.id))
            if (exists) return prev
            return [newItem, ...prev]
          })
          setRealtimeEvents(prev => ({ ...prev, inserts: prev.inserts + 1 }))
        }
      })
      // UPDATE イベント
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'your_table',
        filter: `owner_id=eq.${userId}`
      }, (payload) => {
        console.log('🟡 UPDATE EVENT:', payload)
        const updatedItem = payload.new as YourDataType
        
        if (updatedItem && (updatedItem.owner_id === userId || updatedItem.partner_id === userId)) {
          setData(prev => prev.map(item => 
            String(item.id) === String(updatedItem.id) ? updatedItem : item
          ))
          setRealtimeEvents(prev => ({ ...prev, updates: prev.updates + 1 }))
        }
      })
      // DELETE イベント
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'your_table',
        filter: `owner_id=eq.${userId}`
      }, (payload) => {
        console.log('🔴 DELETE EVENT:', payload)
        const deletedId = payload.old.id
        
        if (deletedId) {
          setData(prev => prev.filter(item => String(item.id) !== String(deletedId)))
          setRealtimeEvents(prev => ({ ...prev, deletes: prev.deletes + 1 }))
        }
      })
      .subscribe((status, err) => {
        console.log('📡 Realtime status:', status)
        setRealtimeEvents(prev => ({
          ...prev,
          connectionStatus: status === 'SUBSCRIBED' ? 'connected' : 
                           status === 'CHANNEL_ERROR' ? 'error' : 
                           status === 'TIMED_OUT' ? 'disconnected' : 'unknown'
        }))
        
        if (err) {
          console.error('❌ Realtime error:', err)
        }
      })

    return () => {
      console.log('🧹 Cleaning up Realtime subscription')
      supabase.removeChannel(channel)
    }
  }, [userId])

  return { data, realtimeEvents }
}
```

## 🐛 よくある問題と解決方法

### 問題1: INSERT/UPDATE イベントが届かない

**症状**: DELETE は動作するが、INSERT/UPDATE が受信されない

**原因**: 
- `partner_id=eq.${userId}` フィルタが `null` 値にマッチしない
- Publication 設定で INSERT/UPDATE が無効

**解決方法**:
```typescript
// ❌ 問題のあるフィルタ
filter: `partner_id=eq.${userId}` // partner_id が null の場合マッチしない

// ✅ 修正後
filter: `owner_id=eq.${userId}` // owner_id のみでフィルタ
// + クライアント側で追加判定
if (newItem.owner_id === userId || newItem.partner_id === userId) {
  // 処理実行
}
```

### 問題2: イベントが重複して受信される

**症状**: 同じデータが複数回追加される

**解決方法**:
```typescript
// 重複チェックの実装
setData(prev => {
  const exists = prev.some(item => String(item.id) === String(newItem.id))
  if (exists) {
    console.log('⚠️ 重複データをスキップ:', newItem.id)
    return prev
  }
  return [newItem, ...prev]
})
```

### 問題3: 型の不一致エラー

**症状**: ID の比較で予期しない動作

**原因**: DB の bigserial (number) と TypeScript の string 型の不一致

**解決方法**:
```typescript
// 型安全な比較
String(item.id) === String(newItem.id)
```

### 問題4: 接続遅延

**症状**: 接続状態は「接続中」だが、イベントが届かない

**原因**: WebSocket 接続の初期化遅延

**解決方法**:
- 数秒〜数十秒待つ（正常な動作）
- ブラウザの完全リフレッシュ（Ctrl+Shift+R）
- 別ブラウザでのテスト

## 🔍 デバッグ方法

### 1. デバッグ用無フィルタチャンネル

```typescript
// すべてのイベントを受信するデバッグチャンネル
const debugChannel = supabase
  .channel(`debug-${Date.now()}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'your_table'
  }, (payload) => {
    console.log('🐞 DEBUG EVENT (no filter):', payload)
  })
  .subscribe()

// クリーンアップ時に忘れずに削除
return () => {
  supabase.removeChannel(channel)
  supabase.removeChannel(debugChannel)
}
```

### 2. リアルタイム接続テストパネル

```typescript
// UI でリアルタイム状況を表示
<div className="realtime-debug-panel">
  <h3>🔧 リアルタイム接続テスト</h3>
  <div>接続状態: {realtimeEvents.connectionStatus}</div>
  <div>追加: {realtimeEvents.inserts}</div>
  <div>更新: {realtimeEvents.updates}</div>
  <div>削除: {realtimeEvents.deletes}</div>
</div>
```

### 3. Supabase Realtime Inspector

1. Supabase Dashboard → Database → Realtime
2. Inspector タブでサーバ側のイベント送信を確認
3. Channel: `chores` でフィルタ

## 📚 参考資料

- [Supabase Realtime 公式ドキュメント](https://supabase.com/docs/guides/realtime)
- [Postgres Changes API](https://supabase.com/docs/guides/realtime/postgres-changes)
- [Publication と REPLICA IDENTITY](https://www.postgresql.org/docs/current/logical-replication-publication.html)

## 🎯 ベストプラクティス

### 1. フィルタリング戦略
- **サーバ側フィルタ**: パフォーマンス向上のため基本的なフィルタを適用
- **クライアント側フィルタ**: セキュリティと柔軟性のため追加判定を実装

### 2. エラーハンドリング
```typescript
.subscribe((status, err) => {
  if (err) {
    console.error('❌ Realtime subscription error:', err)
    // 必要に応じて再接続ロジックを実装
  }
  if (status === 'CHANNEL_ERROR') {
    console.error('❌ Channel error - check Supabase connection and RLS policies')
  }
})
```

### 3. メモリリーク防止
```typescript
// useEffect のクリーンアップで必ずチャンネルを削除
return () => {
  supabase.removeChannel(channel)
  // デバッグチャンネルも忘れずに
  if (debugChannel) {
    supabase.removeChannel(debugChannel)
  }
}
```

### 4. チャンネル名の一意性
```typescript
// タイムスタンプを含めて一意性を確保
.channel(`your-table-${userId}-${Date.now()}`)
```

## 🚀 実装完了チェックリスト

- [ ] REPLICA IDENTITY FULL 設定済み
- [ ] Publication で INSERT/UPDATE/DELETE 有効
- [ ] RLS ポリシー設定済み
- [ ] クライアント側フィルタリング実装
- [ ] 重複チェック実装
- [ ] エラーハンドリング実装
- [ ] メモリリーク防止（クリーンアップ）実装
- [ ] デバッグ用ログ実装
- [ ] 複数ブラウザでの動作確認
- [ ] リアルタイム接続テストパネル実装

---

**作成日**: 2025-01-07  
**最終更新**: 2025-01-07  
**対象バージョン**: Supabase JS v2.x, Next.js 15+