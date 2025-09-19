# ⚡ リアルタイム機能の最適化

## 機能概要

Supabase Realtimeを使用したリアルタイム機能の安定化と最適化を行う。

## 現在の問題

### 技術的課題
- [ ] リアルタイム接続の不安定性
- [ ] 重複したイベント処理
- [ ] メモリリークの可能性
- [ ] パフォーマンスの劣化
- [ ] エラーハンドリングの不備

### 実装上の問題
- [ ] 複数コンポーネントでの重複購読
- [ ] 適切でないフィルタリング
- [ ] 接続状態の管理不備
- [ ] デバッグ情報の不足

## 解決策

### Phase 1: アーキテクチャの整理
- [ ] リアルタイム機能を統一フックに集約
- [ ] 購読の重複を排除
- [ ] 接続状態の一元管理
- [ ] エラーハンドリングの統一

### Phase 2: パフォーマンス最適化
- [ ] 適切なフィルタリングの実装
- [ ] 不要な再レンダリングの防止
- [ ] メモリリークの修正
- [ ] 接続の効率化

### Phase 3: 監視・デバッグ機能
- [ ] リアルタイム接続状態の可視化
- [ ] イベントログの実装
- [ ] パフォーマンス監視
- [ ] エラー追跡

## 技術的詳細

### 統一リアルタイムフック
```typescript
// src/hooks/useRealtime.ts
export const useRealtime = () => {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [subscriptions, setSubscriptions] = useState<Map<string, RealtimeChannel>>(new Map());
  const [eventLog, setEventLog] = useState<RealtimeEvent[]>([]);
  
  // 家事の変更を購読
  const subscribeToChores = useCallback((userId: string) => {
    const channelName = `chores:${userId}`;
    
    if (subscriptions.has(channelName)) {
      return subscriptions.get(channelName);
    }
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chores',
          filter: `owner_id=eq.${userId},partner_id=eq.${userId}`
        },
        (payload) => {
          logEvent('chores_change', payload);
          handleChoresChange(payload);
        }
      )
      .on('presence', { event: 'sync' }, () => {
        setConnectionStatus('connected');
      })
      .on('presence', { event: 'leave' }, () => {
        setConnectionStatus('disconnected');
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
        } else if (status === 'CHANNEL_ERROR') {
          setConnectionStatus('disconnected');
          logError('Subscription failed', channelName);
        }
      });
    
    setSubscriptions(prev => new Map(prev).set(channelName, channel));
    return channel;
  }, [subscriptions]);
  
  // 感謝メッセージの変更を購読
  const subscribeToThankYouMessages = useCallback((userId: string) => {
    const channelName = `thank_you:${userId}`;
    
    if (subscriptions.has(channelName)) {
      return subscriptions.get(channelName);
    }
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'thank_you_messages',
          filter: `receiver_id=eq.${userId}`
        },
        (payload) => {
          logEvent('thank_you_received', payload);
          handleThankYouMessage(payload);
        }
      )
      .subscribe();
    
    setSubscriptions(prev => new Map(prev).set(channelName, channel));
    return channel;
  }, [subscriptions]);
  
  // クリーンアップ
  const unsubscribeAll = useCallback(() => {
    subscriptions.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    setSubscriptions(new Map());
    setConnectionStatus('disconnected');
  }, [subscriptions]);
  
  // コンポーネントアンマウント時のクリーンアップ
  useEffect(() => {
    return () => {
      unsubscribeAll();
    };
  }, [unsubscribeAll]);
  
  return {
    connectionStatus,
    subscribeToChores,
    subscribeToThankYouMessages,
    unsubscribeAll,
    eventLog,
    subscriptions: Array.from(subscriptions.keys())
  };
};
```

### 最適化されたフィルタリング
```sql
-- 効率的なRLSポリシー
CREATE POLICY "chores_realtime_select"
ON public.chores FOR SELECT
USING (
  owner_id = auth.uid() OR 
  partner_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM partnerships 
    WHERE (user1_id = auth.uid() AND user2_id = owner_id) OR
          (user2_id = auth.uid() AND user1_id = owner_id)
  )
);
```

### パフォーマンス監視
```typescript
// src/hooks/useRealtimePerformance.ts
export const useRealtimePerformance = () => {
  const [metrics, setMetrics] = useState({
    connectionTime: 0,
    eventCount: 0,
    errorCount: 0,
    lastEventTime: null,
    averageLatency: 0
  });
  
  const trackEvent = useCallback((eventType: string, timestamp: number) => {
    setMetrics(prev => ({
      ...prev,
      eventCount: prev.eventCount + 1,
      lastEventTime: timestamp,
      averageLatency: calculateLatency(timestamp)
    }));
  }, []);
  
  const trackError = useCallback((error: Error) => {
    setMetrics(prev => ({
      ...prev,
      errorCount: prev.errorCount + 1
    }));
    
    // エラーログの送信
    console.error('Realtime error:', error);
  }, []);
  
  return { metrics, trackEvent, trackError };
};
```

## 実装ファイル

### 修正が必要なファイル
- `src/hooks/useRealtime.ts` - 統一リアルタイムフックの実装
- `src/components/ChoresList.tsx` - 新しいフックの使用
- `src/components/NotificationCenter.tsx` - リアルタイム通知の最適化
- `src/components/RealtimeDebugPanel.tsx` - デバッグ機能の拡張

### 新規作成が必要なファイル
- `src/hooks/useRealtimePerformance.ts` - パフォーマンス監視
- `src/services/realtimeService.ts` - リアルタイムサービスの統一
- `src/utils/realtimeUtils.ts` - リアルタイム関連ユーティリティ
- `src/components/RealtimeStatus.tsx` - 接続状態表示

## 最適化項目

### 接続管理
- [ ] 単一接続の維持
- [ ] 自動再接続機能
- [ ] 接続状態の監視
- [ ] タイムアウト処理

### イベント処理
- [ ] 重複イベントの除去
- [ ] イベントの優先度管理
- [ ] バッチ処理の実装
- [ ] 遅延処理の最適化

### メモリ管理
- [ ] 適切なクリーンアップ
- [ ] イベントリスナーの管理
- [ ] メモリリークの防止
- [ ] ガベージコレクションの最適化

### エラーハンドリング
- [ ] 接続エラーの処理
- [ ] 認証エラーの処理
- [ ] ネットワークエラーの処理
- [ ] 自動復旧機能

## 監視・デバッグ機能

### リアルタイム状態表示
```typescript
// 接続状態の可視化
const RealtimeStatus = () => {
  const { connectionStatus, subscriptions, eventLog } = useRealtime();
  
  return (
    <div className="realtime-status">
      <div className={`status ${connectionStatus}`}>
        {connectionStatus === 'connected' ? '🟢' : '🔴'} {connectionStatus}
      </div>
      <div>Active subscriptions: {subscriptions.length}</div>
      <div>Recent events: {eventLog.slice(-5).length}</div>
    </div>
  );
};
```

### パフォーマンス監視ダッシュボード
- [ ] 接続時間の追跡
- [ ] イベント頻度の監視
- [ ] エラー率の追跡
- [ ] レイテンシの測定

## テスト要件

### 単体テスト
- [ ] リアルタイムフックのテスト
- [ ] 接続状態管理のテスト
- [ ] エラーハンドリングのテスト
- [ ] メモリリークのテスト

### 統合テスト
- [ ] 複数コンポーネント間の連携テスト
- [ ] 長時間接続のテスト
- [ ] ネットワーク断絶時のテスト
- [ ] 高負荷時のテスト

### E2Eテスト
- [ ] リアルタイム同期の確認
- [ ] 接続状態の変化テスト
- [ ] エラー復旧のテスト
- [ ] パフォーマンステスト

## 依存関係

### 前提条件
- Issue #1: RLSポリシーエラーの解決
- 基本的なSupabase接続が動作していること

### 後続タスク
- Issue #2: 家事完了機能（リアルタイム同期）
- Issue #3: ありがとう機能（リアルタイム通知）
- Issue #6: 通知機能の拡張

## 優先度

**Medium** - 機能の安定性向上のため重要

## 見積もり

**工数**: 2-3日
**複雑度**: High（複雑な状態管理、パフォーマンス最適化）

## 受け入れ基準

- [ ] リアルタイム接続が安定している
- [ ] 重複イベントが発生しない
- [ ] メモリリークが発生しない
- [ ] エラーハンドリングが適切に動作する
- [ ] パフォーマンス要件を満たす
- [ ] デバッグ機能が正しく動作する

## パフォーマンス目標

- [ ] 接続時間: < 2秒
- [ ] イベント遅延: < 500ms
- [ ] メモリ使用量: 安定（増加し続けない）
- [ ] エラー率: < 1%
- [ ] 接続維持率: > 99%

## ラベル

`enhancement`, `performance`, `realtime`, `optimization`, `monitoring`

---

**作成日**: 2024年12月
**担当者**: 未割り当て
**マイルストーン**: MVP リリース前