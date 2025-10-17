'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { useAuth } from './AuthContext'

// 通知の型定義
export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  timestamp: Date
  read: boolean
  userId?: string
  actionUrl?: string
  // 通知の発生源分類（フィルタリングに利用）
  source?: 'self' | 'partner' | 'system' | 'unknown'
}

// 通知コンテキストの型定義
interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAllNotifications: () => void
}

// 通知コンテキストの作成
const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

// 通知プロバイダーコンポーネント
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const { user } = useAuth()
  const supabase = createSupabaseBrowserClient()
  const instanceIdRef = useRef<string | null>(null)
  // StrictModeガードを撤廃して、毎回購読を確実に開始する

  // 新しい通知を追加する関数
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    // シンプル方針: パートナーのアクションのみ通知として追加
    const src = notification.source ?? 'unknown'
    if (src !== 'partner') {
      return
    }
    // より安全なUUID生成（crypto.randomUUIDが利用できない場合の代替）
    const generateId = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID()
      }
      // フォールバック: 簡易的なランダムID生成
      return 'notification-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
    }
    
    const newNotification: Notification = {
      ...notification,
      id: generateId(),
      timestamp: new Date(),
      read: false,
      source: notification.source ?? 'unknown',
    }
    
    setNotifications(prev => [newNotification, ...prev])
    
    // ブラウザ通知を表示（ユーザーが許可している場合）
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: newNotification.id,
      })
    }
  }, [])

  // 通知を既読にする関数
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    )
  }, [])

  // 全ての通知を既読にする関数
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    )
  }, [])

  // 通知を削除する関数
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])

  // 全ての通知をクリアする関数
  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  // 未読通知数を計算
  const unreadCount = notifications.filter(notification => !notification.read).length

  // ブラウザ通知の許可を要求
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission()
      }
    }
  }, [])

  // Supabaseリアルタイム機能でデータベースの変更を監視
  useEffect(() => {
    console.log('[NotificationProvider] effect run, user:', user?.id || 'none')
    if (!user) {
      console.log('[NotificationProvider] user not ready → skip subscribe')
      return
    }

    console.log('リアルタイム通知の監視を開始します...')

    // チャンネル参照（クリーンアップ用）
    let choresChannel: ReturnType<typeof supabase.channel> | null = null
    let thanksChannel: ReturnType<typeof supabase.channel> | null = null

    const setupRealtime = async () => {
      try {
        // 1) セッション取得 → 2) Realtime認証設定 → 3) チャンネル購読
        const { data: { session } } = await supabase.auth.getSession()
        const rt: any = (supabase as any).realtime
        if (session?.access_token && typeof rt?.setAuth === 'function') {
          rt.setAuth(session.access_token)
          console.log('[NotificationProvider] realtime auth set')
        } else {
          console.warn('[NotificationProvider] no access token available for realtime')
        }

        // ユニークなチャンネル識別子（StrictModeの再購読でも衝突しないように）
        if (!instanceIdRef.current) {
          instanceIdRef.current = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
            ? crypto.randomUUID()
            : `i-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
        }
        const topicSuffix = `${instanceIdRef.current}`
        console.log('[NotificationProvider] topic suffix:', topicSuffix)

        // 家事の変更を監視
        choresChannel = supabase
          .channel(`user-${user.id}-notif-chores-v1-${topicSuffix}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'chores',
            },
            async (payload) => {
              console.log('家事データの変更を検出:', payload)
              switch (payload.eventType) {
                case 'INSERT': {
                  const isAddedByMe = payload.new.owner_id === user.id
                  if (!isAddedByMe) {
                    addNotification({
                      title: '新しい家事が追加されました',
                      message: `家事「${payload.new.title}」をパートナーが追加しました`,
                      type: 'info',
                      userId: user.id,
                      source: 'partner',
                    })
                  }
                  break
                }
                case 'UPDATE': {
                  if (payload.new.done && !payload.old.done) {
                    try {
                      const { data: latestCompletion, error: compErr } = await supabase
                        .from('completions')
                        .select('id,user_id,created_at')
                        .eq('chore_id', payload.new.id)
                        .order('created_at', { ascending: false })
                        .limit(1)
                      const completedBy: string | undefined = latestCompletion?.[0]?.user_id
                      const isCompletedByPartner = !!completedBy && completedBy !== user.id
                      if (compErr) {
                        console.warn('完了者取得に失敗:', compErr)
                      }
                      if (isCompletedByPartner) {
                        addNotification({
                          title: '家事が完了しました',
                          message: `家事「${payload.new.title}」をパートナーが完了しました`,
                          type: 'success',
                          userId: user.id,
                          actionUrl: '/completed-chores',
                          source: 'partner',
                        })
                      }
                    } catch (e) {
                      console.warn('完了通知処理中に例外:', e)
                    }
                  }
                  break
                }
                case 'DELETE': {
                  break
                }
              }
            }
          )
          .subscribe((status) => {
            console.log('chores channel status:', status)
          })

        console.log('[NotificationProvider] chores channel created')

        // ありがとうメッセージの変更を監視（サーバー側フィルタ + 念のためクライアント側判定）
        thanksChannel = supabase
          .channel(`user-${user.id}-notif-thanks-v2-${topicSuffix}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'thanks',
              filter: `to_id=eq.${user.id}`,
            },
            async (payload) => {
              console.log('ありがとうメッセージの追加を検出:', payload)
              if (payload.new?.to_id !== user.id) {
                console.log('ありがとう通知: 自分宛ではないためスキップ(クライアント判定)', {
                  to_id: payload.new?.to_id,
                  my_id: user.id,
                })
                return
              }
              try {
                const { data, error } = await supabase
                  .from('thanks')
                  .select(`
                      *,
                      from_user:profiles!from_id(display_name),
                      to_user:profiles!to_id(display_name)
                    `)
                  .eq('id', payload.new.id)
                  .single()
                const senderName = data?.from_user?.display_name || 'パートナー'
                const messageText = data?.message ?? payload.new.message ?? ''
                if (error) {
                  console.warn('ありがとう詳細取得に失敗したため、簡易通知を表示します:', error)
                  addNotification({
                    title: 'ありがとうメッセージを受け取りました',
                    message: `${messageText}`,
                    type: 'success',
                    userId: user.id,
                    source: 'partner',
                  })
                } else {
                  addNotification({
                    title: 'ありがとうメッセージを受け取りました',
                    message: `${senderName}から: ${messageText}`,
                    type: 'success',
                    userId: user.id,
                    source: 'partner',
                  })
                }
              } catch (e) {
                console.error('ありがとうメッセージ詳細補完時にエラー:', e)
                addNotification({
                  title: 'ありがとうメッセージを受け取りました',
                  message: `${payload.new?.message ?? ''}`,
                  type: 'success',
                  userId: user.id,
                  source: 'partner',
                })
              }
            }
          )
          .subscribe((status) => {
            console.log('thanks channel status:', status)
          })
    
        console.log('[NotificationProvider] thanks channel created')
    
        // 完了通知はcompletionsのINSERTを監視（REPLICA IDENTITY依存を回避）
        const completionsChannel = supabase
          .channel(`user-${user.id}-notif-completions-v1-${topicSuffix}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'completions',
            },
            async (payload) => {
              console.log('完了エントリの追加を検出:', payload)
              const completedBy = payload.new?.user_id
              if (!completedBy || completedBy === user.id) {
                return
              }
              try {
                const { data: chore, error: choreErr } = await supabase
                  .from('chores')
                  .select('title')
                  .eq('id', payload.new?.chore_id)
                  .single()
                if (choreErr) {
                  console.warn('家事タイトル取得に失敗:', choreErr)
                }
                addNotification({
                  title: '家事が完了しました',
                  message: `家事「${chore?.title ?? '不明'}」をパートナーが完了しました`,
                  type: 'success',
                  userId: user.id,
                  actionUrl: '/completed-chores',
                  source: 'partner',
                })
              } catch (e) {
                console.warn('完了通知処理中に例外:', e)
              }
            }
          )
          .subscribe((status) => {
            console.log('completions channel status:', status)
          })
    
        console.log('[NotificationProvider] completions channel created')
    
        // クリーンアップ関数
        return () => {
          console.log('リアルタイム通知の監視を停止します...')
          if (choresChannel) supabase.removeChannel(choresChannel)
          if (thanksChannel) supabase.removeChannel(thanksChannel)
          supabase.removeChannel(completionsChannel)
        }
      } catch (err) {
        console.error('Realtime購読初期化エラー:', err)
      }
    }

    setupRealtime()

    // クリーンアップ関数
    return () => {
      console.log('リアルタイム通知の監視を停止します...')
      if (choresChannel) supabase.removeChannel(choresChannel)
      if (thanksChannel) supabase.removeChannel(thanksChannel)
    }
  }, [user, supabase, addNotification])

  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

// 通知コンテキストを使用するためのカスタムフック
export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}