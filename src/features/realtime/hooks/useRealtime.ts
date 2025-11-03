'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase'
import { Chore } from '@/features/chores/types/chore'

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
  const CHANNEL_VERSION = 'v2'
  // クライアントインスタンスごとに一意のサフィックスを付与して、トピック衝突（bindings mismatch）を回避
  const instanceIdRef = useRef<string>('')
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [lastEventTime, setLastEventTime] = useState<Date | null>(null)
  const [eventCount, setEventCount] = useState(0)
  
  // チャンネルの参照を保持（テーブル別に分割）
  const choresChannelRef = useRef<RealtimeChannel | null>(null)
  const profileChannelRef = useRef<RealtimeChannel | null>(null)
  const completionsChannelRef = useRef<RealtimeChannel | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isReconnectingRef = useRef(false)
  const reconnectAttemptsRef = useRef(0)
  const connectNonceRef = useRef(0)

  // 🔄 リアルタイム接続状態のデバッグログ
  useEffect(() => {
    console.log('🔄 Realtime state changed:', {
      isConnected,
      connectionError,
      lastEventTime: lastEventTime?.toISOString(),
      eventCount,
      hasChoresChannel: !!choresChannelRef.current,
      hasProfileChannel: !!profileChannelRef.current,
      hasCompletionsChannel: !!completionsChannelRef.current,
      userId: user?.id
    })
  }, [isConnected, connectionError, lastEventTime, eventCount, user?.id])

  /**
   * 家事変更イベントの処理
   */
  const handleChoreChange = useCallback(async (
    payload: RealtimePostgresChangesPayload<Chore>
  ) => {
    console.log('🔄 Realtime chore event START:', {
      eventType: payload.eventType,
      table: payload.table,
      choreId: (payload.new as Chore)?.id || (payload.old as Chore)?.id,
      userId: user?.id,
      hasUser: !!user,
      hasCallback: !!callbacks.onChoreChange,
      timestamp: new Date().toISOString()
    })

    if (!user || !callbacks.onChoreChange) {
      console.log('🚫 Realtime event skipped:', {
        hasUser: !!user,
        hasCallback: !!callbacks.onChoreChange
      })
      return
    }

    console.log('🔄 Realtime chore event received:', {
      eventType: payload.eventType,
      table: payload.table,
      new: payload.new,
      old: payload.old,
      userId: user.id
    })

    // 受信行が自分に関係するかを確認（owner_id または partner_id が一致）
    const row = (payload.new as any) ?? (payload.old as any)
    if (row && row.owner_id && row.partner_id) {
      const related = row.owner_id === user.id || row.partner_id === user.id
      if (!related) {
        console.log('↪️ Skipping unrelated chore change for user:', user.id)
        return
      }
    }

    setLastEventTime(new Date())
    setEventCount(prev => prev + 1)

    try {
      // 認証状態の確認
      const { data: { session } } = await supabase.auth.getSession()
      console.log('🔍 Realtime session check:', {
        hasSession: !!session,
        userId: session?.user?.id,
        matchesCurrentUser: session?.user?.id === user.id
      })

      // 最新の家事一覧を取得（完了記録のメタデータ込みで更新）
      const { data: choresData, error } = await supabase
        .from('chores')
        .select(`
          *,
          completions (
            id,
            chore_id,
            user_id,
            created_at
          )
        `)
        .or(`owner_id.eq.${user.id},partner_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Failed to fetch updated chores:', error)
        console.error('❌ Realtime fetch error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        return
      }

      console.log('✅ Chores updated via realtime:', choresData?.length || 0, 'items')
      callbacks.onChoreChange(choresData || [])
    } catch (error) {
      console.error('❌ Error handling chore change:', error)
    }
  }, [user, callbacks])

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
      // 最新の家事一覧を取得（完了記録のメタデータ込みで更新）
      const { data: choresData, error } = await supabase
        .from('chores')
        .select(`
          *,
          completions (
            id,
            chore_id,
            user_id,
            created_at
          )
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
  }, [user, callbacks])

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
  }, [user, callbacks])

  /**
   * リアルタイム接続を確立
   */
  const connect = useCallback(async () => {
    if (!user || choresChannelRef.current || profileChannelRef.current || isReconnectingRef.current) {
      console.log('🔄 Skipping realtime connection:', {
        hasUser: !!user,
        hasChoresChannel: !!choresChannelRef.current,
        hasProfileChannel: !!profileChannelRef.current,
        isReconnecting: isReconnectingRef.current
      })
      return
    }

    console.log('🔌 Establishing realtime connection for user:', user.id)
    setConnectionError(null)

    // 認証状態の確認
    const { data: { session } } = await supabase.auth.getSession()
    console.log('🔍 Realtime connection session check:', {
      hasSession: !!session,
      userId: session?.user?.id,
      matchesCurrentUser: session?.user?.id === user.id,
      accessToken: session?.access_token ? 'present' : 'missing'
    })

    // 最新のアクセストークンをRealtimeに設定（推奨）
    try {
      if (session?.access_token) {
        // 型定義に現れない場合があるため安全に呼び出す
        const rt: any = (supabase as any).realtime
        if (typeof rt?.setAuth === 'function') {
          rt.setAuth(session.access_token)
        }
      }
    } catch (err) {
      console.warn('⚠️ Failed to set realtime auth token:', err)
    }

    try {
      // インスタンスIDを初期化（初回のみ）
      if (!instanceIdRef.current) {
        const uuid = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
          ? crypto.randomUUID()
          : `i-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
        instanceIdRef.current = uuid
      }
      // 接続試行ごとに異なるトピックを使用し、サーバーの古いbindingsとの不整合を回避
      connectNonceRef.current += 1
      const topicSuffix = `${instanceIdRef.current}-r${connectNonceRef.current}`

      // テーブルごとにチャンネル分割
      const choresChannel = supabase.channel(`user-${user.id}-chores-${CHANNEL_VERSION}-${topicSuffix}`)
      const profileChannel = supabase.channel(`user-${user.id}-profile-${CHANNEL_VERSION}-${topicSuffix}`)
      const completionsChannel = supabase.channel(`user-${user.id}-completions-${CHANNEL_VERSION}-${topicSuffix}`)

      // 家事テーブルの変更購読
      choresChannel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chores' },
        handleChoreChange
      )

      // 完了記録テーブルの変更購読
      completionsChannel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'completions' },
        handleCompletionChange
      )

      // プロフィールテーブルの変更購読（自身のプロフィールのみ）
      profileChannel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        handleProfileChange
      )

      // それぞれ購読
      choresChannel.subscribe((status, err) => {
        console.log('🔌 Chores channel status:', status, err ? 'Error:' : '', err)
        if (status === 'SUBSCRIBED') {
          // どちらかが接続できれば開始とみなす
          setIsConnected(true)
          setConnectionError(null)
          reconnectAttemptsRef.current = 0
          console.log('✅ Chores realtime connected')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Chores channel error:', err)
          setConnectionError(`家事チャンネルでエラー: ${err?.message || err}`)
        }
      })

      profileChannel.subscribe((status, err) => {
        console.log('🔌 Profile channel status:', status, err ? 'Error:' : '', err)
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
          setConnectionError(null)
           reconnectAttemptsRef.current = 0
          console.log('✅ Profile realtime connected')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Profile channel error:', err)
          setConnectionError(`プロフィールチャンネルでエラー: ${err?.message || err}`)
        }
      })

      completionsChannel.subscribe((status, err) => {
        console.log('🔌 Completions channel status:', status, err ? 'Error:' : '', err)
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
          setConnectionError(null)
          reconnectAttemptsRef.current = 0
          console.log('✅ Completions realtime connected')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Completions channel error:', err)
          setConnectionError(`完了記録チャンネルでエラー: ${err?.message || err}`)
        }
      })

      choresChannelRef.current = choresChannel
      profileChannelRef.current = profileChannel
      completionsChannelRef.current = completionsChannel
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
    if (choresChannelRef.current) {
      console.log('🔌 Disconnecting chores channel')
      supabase.removeChannel(choresChannelRef.current)
      choresChannelRef.current = null
    }
    if (profileChannelRef.current) {
      console.log('🔌 Disconnecting profile channel')
      supabase.removeChannel(profileChannelRef.current)
      profileChannelRef.current = null
    }
    if (completionsChannelRef.current) {
      console.log('🔌 Disconnecting completions channel')
      supabase.removeChannel(completionsChannelRef.current)
      completionsChannelRef.current = null
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
    reconnectAttemptsRef.current += 1
    
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
    if (reconnectAttemptsRef.current >= 5) {
      console.warn('⏳ Reconnect attempts exceeded; stopping auto-reconnect.')
      return
    }

    console.log('🔄 Auto-reconnecting in 5 seconds...')
    isReconnectingRef.current = true
    reconnectAttemptsRef.current += 1
    
    reconnectTimeoutRef.current = setTimeout(() => {
      isReconnectingRef.current = false
      connect()
    }, 5000)
  }, [user, connect])

  // ユーザーログイン時に自動接続
  useEffect(() => {
    // ユーザーがいない場合は切断
    if (!user) {
      disconnect()
      return
    }

    // まだチャンネルが無ければ接続
    if (!choresChannelRef.current && !profileChannelRef.current) {
      connect()
    }
    // クリーンアップはユーザー変更時/アンマウント時に必要最小限のみ
    return () => {
      // ここでは何もしない（切断は上の分岐で行う）
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
