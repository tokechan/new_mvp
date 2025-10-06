'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

/**
 * リアルタイム接続管理のカスタムフック
 * ChoresList.tsxから分離されたRealtime接続テスト機能
 */
export function useRealtimeConnection() {
  const { user } = useAuth()
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<string>('未接続')
  const [testChannel, setTestChannel] = useState<RealtimeChannel | null>(null)

  /**
   * リアルタイム接続をテストする
   */
  const testRealtimeConnection = useCallback(async () => {
    if (!user) {
      setConnectionStatus('ユーザー未ログイン')
      setIsConnected(false)
      return
    }

    setConnectionStatus('接続中...')
    setIsConnected(null)

    try {
      // 既存のチャンネルがあれば削除
      if (testChannel) {
        await supabase.removeChannel(testChannel)
        setTestChannel(null)
      }

      // テスト用チャンネルを作成
      const channel = supabase
        .channel(`test-connection-${user.id}`)
        .on('presence', { event: 'sync' }, () => {
          console.log('✅ Realtime接続テスト成功')
          setIsConnected(true)
          setConnectionStatus('接続成功')
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('👋 新しいプレゼンス参加:', key, newPresences)
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          console.log('👋 プレゼンス離脱:', key, leftPresences)
        })

      // チャンネルを購読
      const status = await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          console.log('📡 チャンネル購読成功')
          // プレゼンスを追跡開始
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          })
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ チャンネルエラー')
          setIsConnected(false)
          setConnectionStatus('接続エラー')
        } else if (status === 'TIMED_OUT') {
          console.error('⏰ 接続タイムアウト')
          setIsConnected(false)
          setConnectionStatus('タイムアウト')
        } else if (status === 'CLOSED') {
          console.log('🔒 チャンネルクローズ')
          setIsConnected(false)
          setConnectionStatus('接続終了')
        }
      })

      setTestChannel(channel)

      // 10秒後にタイムアウト判定
      setTimeout(() => {
        if (isConnected === null) {
          setIsConnected(false)
          setConnectionStatus('接続タイムアウト')
        }
      }, 10000)

    } catch (error) {
      console.error('💥 Realtime接続テストエラー:', error)
      setIsConnected(false)
      setConnectionStatus(`エラー: ${error instanceof Error ? error.message : '不明なエラー'}`)
    }
  }, [user, testChannel, isConnected])

  /**
   * リアルタイム接続を停止する
   */
  const stopRealtimeConnection = useCallback(async () => {
    if (testChannel) {
      await supabase.removeChannel(testChannel)
      setTestChannel(null)
    }
    setIsConnected(null)
    setConnectionStatus('未接続')
  }, [testChannel])

  /**
   * コンポーネントアンマウント時のクリーンアップ
   */
  useEffect(() => {
    return () => {
      if (testChannel) {
        supabase.removeChannel(testChannel)
      }
    }
  }, [testChannel])

  return {
    isConnected,
    connectionStatus,
    testRealtimeConnection,
    stopRealtimeConnection
  }
}