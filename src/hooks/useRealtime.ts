'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase'
import { Chore } from '@/types/chore'

// 型定義
type DatabaseChore = Database['public']['Tables']['chores']['Row']
type Completion = Database['public']['Tables']['completions']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

// リアルタイムイベントのコールバック型
interface RealtimeCallbacks {
  onChoreChange?: (chores: Chore[]) => void
  onPartnerChange?: (partner: Profile | null) => void
}

/**
 * リアルタイム機能のカスタムフック
 * Supabase Realtimeの接続管理とイベント処理の責務を担当
 */
export function useRealtime(callbacks: RealtimeCallbacks) {
  const { user } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [lastEventTime, setLastEventTime] = useState<Date | null>(null)
  const [eventCount, setEventCount] = useState(0)
  
  // チャンネルの参照を保持
  const channelRef = useRef<RealtimeChannel | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isReconnectingRef = useRef(false)

  /**
   * 家事変更イベントの処理
   */
  const handleChoreChange = useCallback(async (
    payload: RealtimePostgresChangesPayload<Chore>
  ) => {
    if (!user || !callbacks.onChoreChange) return

    console.log('🔄 Realtime chore event received:', {
      eventType: payload.eventType,
      table: payload.table,
      new: payload.new,
      old: payload.old
    })

    setLastEventTime(new Date())
    setEventCount(prev => prev + 1)

    try {
      // 最新の家事一覧を取得して更新
      const { data: choresData, error } = await supabase
        .from('chores')
        .select(`
          *,
          completions (*)
        `)
        .or(`owner_id.eq.${user.id},partner_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Failed to fetch updated chores:', error)
        return
      }

      console.log('✅ Chores updated via realtime:', choresData?.length || 0, 'items')
      callbacks.onChoreChange(choresData || [])
    } catch (error) {
      console.error('❌ Error handling chore change:', error)
    }
  }, [user, callbacks.onChoreChange])

  /**
   * 完了記録変更イベントの処理
   */
  const handleCompletionChange = useCallback(async (
    payload: RealtimePostgresChangesPayload<Completion>
  ) => {
    if (!user || !callbacks.onChoreChange) return

    console.log('🔄 Realtime completion event received:', {
      eventType: payload.eventType,
      table: payload.table,
      new: payload.new,
      old: payload.old
    })

    setLastEventTime(new Date())
    setEventCount(prev => prev + 1)

    try {
      // 最新の家事一覧を取得して更新
      const { data: choresData, error } = await supabase
        .from('chores')
        .select(`
          *,
          completions (*)
        `)
        .or(`owner_id.eq.${user.id},partner_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Failed to fetch updated chores after completion change:', error)
        return
      }

      console.log('✅ Chores updated via completion realtime:', choresData?.length || 0, 'items')
      callbacks.onChoreChange(choresData || [])
    } catch (error) {
      console.error('❌ Error handling completion change:', error)
    }
  }, [user, callbacks.onChoreChange])

  /**
   * プロフィール変更イベントの処理
   */
  const handleProfileChange = useCallback(async (
    payload: RealtimePostgresChangesPayload<Profile>
  ) => {
    if (!user || !callbacks.onPartnerChange) return

    console.log('🔄 Realtime profile event received:', {
      eventType: payload.eventType,
      table: payload.table,
      new: payload.new,
      old: payload.old
    })

    setLastEventTime(new Date())
    setEventCount(prev => prev + 1)

    // 自分のプロフィール変更の場合のみパートナー情報を再取得
    if (payload.new && 'id' in payload.new && payload.new.id === user.id) {
      try {
        // パートナー情報を再取得
        const { data: profile } = await supabase
          .from('profiles')
          .select('partner_id')
          .eq('id', user.id)
          .single()

        if (profile?.partner_id) {
          const { data: partner } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', profile.partner_id)
            .single()

          console.log('✅ Partner info updated via realtime:', partner?.display_name)
          callbacks.onPartnerChange(partner || null)
        } else {
          console.log('✅ Partner unlinked via realtime')
          callbacks.onPartnerChange(null)
        }
      } catch (error) {
        console.error('❌ Error handling profile change:', error)
      }
    }
  }, [user, callbacks.onPartnerChange])

  /**
   * リアルタイム接続を確立
   */
  const connect = useCallback(() => {
    if (!user || channelRef.current || isReconnectingRef.current) {
      console.log('🔄 Skipping realtime connection:', {
        hasUser: !!user,
        hasChannel: !!channelRef.current,
        isReconnecting: isReconnectingRef.current
      })
      return
    }

    console.log('🔌 Establishing realtime connection for user:', user.id)
    setConnectionError(null)

    try {
      // チャンネルを作成
      const channel = supabase.channel(`user-${user.id}-changes`, {
        config: {
          presence: { key: user.id }
        }
      })

      // 家事テーブルの変更を監視
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chores',
          filter: `owner_id=eq.${user.id}`
        },
        handleChoreChange
      )

      // パートナーの家事も監視（partner_idが自分のIDの場合）
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chores',
          filter: `partner_id=eq.${user.id}`
        },
        handleChoreChange
      )

      // 完了記録テーブルの変更を監視
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'completions'
        },
        handleCompletionChange
      )

      // プロフィールテーブルの変更を監視（パートナー関係の変更用）
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        handleProfileChange
      )

      // 接続状態の監視
      channel.on('presence', { event: 'sync' }, () => {
        console.log('✅ Realtime presence synced')
        setIsConnected(true)
        setConnectionError(null)
      })

      channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('👋 User joined realtime:', key, newPresences)
      })

      channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('👋 User left realtime:', key, leftPresences)
      })

      // チャンネルを購読
      channel.subscribe((status) => {
        console.log('🔌 Realtime subscription status:', status)
        
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
          setConnectionError(null)
          console.log('✅ Realtime connection established successfully')
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false)
          setConnectionError('リアルタイム接続でエラーが発生しました')
          console.error('❌ Realtime channel error')
        } else if (status === 'TIMED_OUT') {
          setIsConnected(false)
          setConnectionError('リアルタイム接続がタイムアウトしました')
          console.error('❌ Realtime connection timed out')
        } else if (status === 'CLOSED') {
          setIsConnected(false)
          console.log('🔌 Realtime connection closed')
        }
      })

      channelRef.current = channel
    } catch (error) {
      console.error('❌ Failed to establish realtime connection:', error)
      setConnectionError('リアルタイム接続の確立に失敗しました')
      setIsConnected(false)
    }
  }, [user, handleChoreChange, handleCompletionChange, handleProfileChange])

  /**
   * リアルタイム接続を切断
   */
  const disconnect = useCallback(() => {
    if (channelRef.current) {
      console.log('🔌 Disconnecting realtime connection')
      channelRef.current.unsubscribe()
      channelRef.current = null
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    setIsConnected(false)
    setConnectionError(null)
    isReconnectingRef.current = false
  }, [])

  /**
   * 手動で再接続
   */
  const reconnect = useCallback(() => {
    if (isReconnectingRef.current) {
      console.log('🔄 Reconnection already in progress')
      return
    }

    console.log('🔄 Manual reconnection requested')
    isReconnectingRef.current = true
    
    disconnect()
    
    // 少し待ってから再接続
    reconnectTimeoutRef.current = setTimeout(() => {
      isReconnectingRef.current = false
      connect()
    }, 1000)
  }, [disconnect, connect])

  /**
   * 自動再接続（接続エラー時）
   */
  const autoReconnect = useCallback(() => {
    if (isReconnectingRef.current || !user) return

    console.log('🔄 Auto-reconnecting in 5 seconds...')
    isReconnectingRef.current = true
    
    reconnectTimeoutRef.current = setTimeout(() => {
      isReconnectingRef.current = false
      connect()
    }, 5000)
  }, [user, connect])

  // ユーザーログイン時に自動接続
  useEffect(() => {
    if (user && !channelRef.current) {
      connect()
    } else if (!user && channelRef.current) {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [user, connect, disconnect])

  // 接続エラー時の自動再接続
  useEffect(() => {
    if (connectionError && user && !isReconnectingRef.current) {
      autoReconnect()
    }
  }, [connectionError, user, autoReconnect])

  return {
    isConnected,
    connectionError,
    lastEventTime,
    eventCount,
    connect,
    disconnect,
    reconnect
  }
}