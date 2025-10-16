import { useEffect, useCallback, useRef } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { ThankYouMessage } from '@/services/thankYouService'

/**
 * 感謝メッセージのリアルタイム通知を管理するカスタムフック
 * 新しい感謝メッセージを受信した際に通知を表示する
 */
export function useThankYouRealtime() {
  const { user } = useAuth()
  const { addNotification } = useNotifications()
  const initializedRef = useRef(false)

  /**
   * 新しい感謝メッセージを受信した際の処理
   * @param payload - Supabaseからのリアルタイムペイロード
   */
  const handleNewThankYou = useCallback(
    (payload: any) => {
      const newThankYou = payload.new as ThankYouMessage
      
      // 自分宛ての感謝メッセージのみ通知
      if (newThankYou.to_id === user?.id) {
        addNotification({
          type: 'success',
          title: 'ありがとうメッセージ',
          message: `${newThankYou.from_user?.display_name || '誰か'}からありがとうメッセージが届きました！`,
        })
      }
    },
    [user?.id, addNotification]
  )

  useEffect(() => {
    if (!user?.id) return
    if (initializedRef.current) return
    initializedRef.current = true

    let channel: RealtimeChannel

    const setupRealtimeSubscription = async () => {
      try {
        const CHANNEL_VERSION = 'v2'
        const instanceId = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
          ? crypto.randomUUID()
          : `i-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
        // thanksテーブルの変更を監視
        channel = supabase
          .channel(`thanks-changes-${user.id}-${CHANNEL_VERSION}-${instanceId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'thanks',
              filter: `to_id=eq.${user.id}`,
            },
            handleNewThankYou
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('感謝メッセージのリアルタイム通知が開始されました')
            } else if (status === 'CHANNEL_ERROR') {
              console.error('感謝メッセージのリアルタイム通知でエラーが発生しました')
            }
          })
      } catch (error) {
        console.error('リアルタイム購読の設定に失敗しました:', error)
      }
    }

    setupRealtimeSubscription()

    // クリーンアップ関数
    return () => {
      if (channel) {
        supabase.removeChannel(channel)
        console.log('感謝メッセージのリアルタイム通知を停止しました')
      }
      initializedRef.current = false
    }
  }, [user?.id, handleNewThankYou])

  return {
    // 必要に応じて状態や関数を返すことができる
    isConnected: !!user?.id,
  }
}