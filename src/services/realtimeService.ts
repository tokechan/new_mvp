'use client'

import { supabase } from '@/lib/supabase'
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase'

// 型定義
type Chore = Database['public']['Tables']['chores']['Row']
type Completion = Database['public']['Tables']['completions']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

// イベントハンドラーの型定義
type ChoreChangeHandler = (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => void
type CompletionChangeHandler = (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => void
type ProfileChangeHandler = (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => void

// 接続状態の型定義
export interface RealtimeConnectionState {
  isConnected: boolean
  lastEventTime: Date | null
  eventCount: number
  error: string | null
}

/**
 * Supabase Realtime機能のサービス層
 * リアルタイム接続とイベント処理を抽象化
 */
export class RealtimeService {
  private channel: RealtimeChannel | null = null
  private connectionState: RealtimeConnectionState = {
    isConnected: false,
    lastEventTime: null,
    eventCount: 0,
    error: null
  }
  private onStateChange?: (state: RealtimeConnectionState) => void
  private userId: string | null = null

  /**
   * リアルタイム接続を初期化
   */
  initialize(userId: string, onStateChange?: (state: RealtimeConnectionState) => void): void {
    this.userId = userId
    this.onStateChange = onStateChange
    this.connect()
  }

  /**
   * リアルタイム接続を確立
   */
  private connect(): void {
    if (!this.userId) {
      console.error('ユーザーIDが設定されていません')
      return
    }

    try {
      // 既存の接続があれば切断
      this.disconnect()

      // 新しいチャンネルを作成
      this.channel = supabase.channel(`user-${this.userId}-changes`)

      // 接続状態の監視
      this.channel
        .on('presence', { event: 'sync' }, () => {
          console.log('🔄 Realtime presence sync')
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('👋 Realtime presence join:', key, newPresences)
          this.updateConnectionState({ isConnected: true, error: null })
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          console.log('👋 Realtime presence leave:', key, leftPresences)
        })

      // チャンネルを購読
      this.channel.subscribe((status) => {
        console.log('📡 Realtime subscription status:', status)
        
        if (status === 'SUBSCRIBED') {
          this.updateConnectionState({ isConnected: true, error: null })
        } else if (status === 'CHANNEL_ERROR') {
          this.updateConnectionState({ 
            isConnected: false, 
            error: 'チャンネル接続エラー' 
          })
        } else if (status === 'TIMED_OUT') {
          this.updateConnectionState({ 
            isConnected: false, 
            error: '接続タイムアウト' 
          })
        } else if (status === 'CLOSED') {
          this.updateConnectionState({ 
            isConnected: false, 
            error: '接続が閉じられました' 
          })
        }
      })

    } catch (error: any) {
      console.error('Realtime接続の初期化に失敗:', error)
      this.updateConnectionState({ 
        isConnected: false, 
        error: `接続初期化エラー: ${error.message}` 
      })
    }
  }

  /**
   * 家事変更イベントの監視を開始
   */
  subscribeToChoreChanges(handler: ChoreChangeHandler): void {
    if (!this.channel || !this.userId) {
      console.error('RealtimeチャンネルまたはユーザーIDが設定されていません')
      return
    }

    this.channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chores',
        filter: `owner_id=eq.${this.userId}`
      },
      (payload) => {
        console.log('🏠 家事変更イベント:', payload)
        this.updateEventCount()
        handler(payload)
      }
    )

    console.log('✅ 家事変更イベントの監視を開始しました')
  }

  /**
   * 完了記録変更イベントの監視を開始
   */
  subscribeToCompletionChanges(handler: CompletionChangeHandler): void {
    if (!this.channel || !this.userId) {
      console.error('RealtimeチャンネルまたはユーザーIDが設定されていません')
      return
    }

    this.channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'completions'
      },
      (payload) => {
        console.log('✅ 完了記録変更イベント:', payload)
        this.updateEventCount()
        handler(payload)
      }
    )

    console.log('✅ 完了記録変更イベントの監視を開始しました')
  }

  /**
   * プロフィール変更イベントの監視を開始
   */
  subscribeToProfileChanges(handler: ProfileChangeHandler): void {
    if (!this.channel || !this.userId) {
      console.error('RealtimeチャンネルまたはユーザーIDが設定されていません')
      return
    }

    this.channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'profiles'
      },
      (payload) => {
        console.log('👤 プロフィール変更イベント:', payload)
        this.updateEventCount()
        handler(payload)
      }
    )

    console.log('✅ プロフィール変更イベントの監視を開始しました')
  }

  /**
   * 手動で再接続を実行
   */
  reconnect(): void {
    console.log('🔄 Realtime手動再接続を実行中...')
    this.connect()
  }

  /**
   * リアルタイム接続を切断
   */
  disconnect(): void {
    if (this.channel) {
      console.log('🔌 Realtime接続を切断中...')
      supabase.removeChannel(this.channel)
      this.channel = null
    }
    
    this.updateConnectionState({ 
      isConnected: false, 
      error: null 
    })
  }

  /**
   * 現在の接続状態を取得
   */
  getConnectionState(): RealtimeConnectionState {
    return { ...this.connectionState }
  }

  /**
   * 接続状態を更新
   */
  private updateConnectionState(updates: Partial<RealtimeConnectionState>): void {
    this.connectionState = {
      ...this.connectionState,
      ...updates
    }
    
    if (this.onStateChange) {
      this.onStateChange(this.getConnectionState())
    }
  }

  /**
   * イベント数を更新
   */
  private updateEventCount(): void {
    this.updateConnectionState({
      eventCount: this.connectionState.eventCount + 1,
      lastEventTime: new Date()
    })
  }

  /**
   * 接続テスト用のダミーイベントを送信
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.userId) {
        throw new Error('ユーザーIDが設定されていません')
      }

      // テスト用の軽量なクエリを実行
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', this.userId)
        .limit(1)

      if (error) {
        throw error
      }

      console.log('✅ Realtime接続テスト成功')
      return true
    } catch (error: any) {
      console.error('❌ Realtime接続テスト失敗:', error)
      this.updateConnectionState({ 
        error: `接続テスト失敗: ${error.message}` 
      })
      return false
    }
  }

  /**
   * 自動再接続の設定
   */
  enableAutoReconnect(intervalMs: number = 30000): void {
    setInterval(() => {
      if (!this.connectionState.isConnected) {
        console.log('🔄 自動再接続を試行中...')
        this.reconnect()
      }
    }, intervalMs)
  }

  /**
   * デバッグ情報を取得
   */
  getDebugInfo(): {
    userId: string | null
    hasChannel: boolean
    connectionState: RealtimeConnectionState
    channelState: string | null
  } {
    return {
      userId: this.userId,
      hasChannel: !!this.channel,
      connectionState: this.getConnectionState(),
      channelState: this.channel?.state || null
    }
  }
}

// シングルトンインスタンス
export const realtimeService = new RealtimeService()