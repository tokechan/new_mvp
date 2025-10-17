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
  filteredNotifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAllNotifications: () => void
  preferences: NotificationPreferences
  updatePreference: (key: keyof NotificationPreferences, value: boolean) => void
}

// 通知の表示フィルタ設定
export interface NotificationPreferences {
  showSelfActions: boolean
  showPartnerActions: boolean
  showUnknownActions: boolean
  showSystemActions: boolean
}

// 通知コンテキストの作成
const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

// 通知プロバイダーコンポーネント
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    showSelfActions: false,
    showPartnerActions: true,
    showUnknownActions: false,
    showSystemActions: false,
  })
  const { user } = useAuth()
  const supabase = createSupabaseBrowserClient()
  const instanceIdRef = useRef<string | null>(null)
  // Hooksは常に同じ順序で呼び出す必要があるため、useRefは無条件で1回のみ呼ぶ
  const initializedRefLocal = useRef(false)
  const initializedRef = (
    (NotificationContext as any)._initializedRef ??
    ((NotificationContext as any)._initializedRef = initializedRefLocal)
  ) as React.MutableRefObject<boolean>

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

  // フィルタ適用済み通知
  const filteredNotifications = notifications.filter((n) => {
    const src = n.source ?? 'unknown'
    if (src === 'self' && !preferences.showSelfActions) return false
    if (src === 'partner' && !preferences.showPartnerActions) return false
    if (src === 'unknown' && !preferences.showUnknownActions) return false
    if (src === 'system' && !preferences.showSystemActions) return false
    return true
  })

  // 設定読み込み
  useEffect(() => {
    if (!user?.id) return
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(`notifPreferences:${user.id}`) : null
      if (raw) {
        const parsed = JSON.parse(raw)
        setPreferences((prev) => ({ ...prev, ...parsed }))
      }
    } catch (e) {
      console.warn('通知フィルタ設定の読み込みに失敗:', e)
    }
  }, [user?.id])

  // 設定保存
  useEffect(() => {
    if (!user?.id) return
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(`notifPreferences:${user.id}`, JSON.stringify(preferences))
      }
    } catch (e) {
      console.warn('通知フィルタ設定の保存に失敗:', e)
    }
  }, [user?.id, preferences])

  const updatePreference = useCallback((key: keyof NotificationPreferences, value: boolean) => {
    setPreferences((prev) => ({ ...prev, [key]: value }))
  }, [])

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
    if (!user) return

    // React StrictMode 下の二重マウントで重複購読を避けるためのガード
    if (initializedRef.current) return
    initializedRef.current = true

    console.log('リアルタイム通知の監視を開始します...')

    // Realtime用に最新アクセストークンを設定（必要な場合）
    ;(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const rt: any = (supabase as any).realtime
        if (session?.access_token && typeof rt?.setAuth === 'function') {
          rt.setAuth(session.access_token)
        }
      } catch (err) {
        console.warn('通知用Realtime認証の設定に失敗:', err)
      }
    })()

    // ユニークなチャンネル識別子（StrictModeの再購読でも衝突しないように）
    if (!instanceIdRef.current) {
      instanceIdRef.current = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
        ? crypto.randomUUID()
        : `i-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    }
    const topicSuffix = `${instanceIdRef.current}`

    // 家事の変更を監視
    const choresChannel = supabase
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
            case 'INSERT':
              // 追加者が自分でない場合のみ通知（パートナーが追加した場合）
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
            case 'UPDATE':
              // 完了状態の変更: 完了者がパートナーの場合のみ通知
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
            case 'DELETE':
              // 削除者の情報は取得できないため、削除通知は表示しない
              // （削除は通常、家事を作成した本人が行うため）
              break
          }
        }
      )
      .subscribe()

    // ありがとうメッセージの変更を監視
    const thanksChannel = supabase
      .channel(`user-${user.id}-notif-thanks-v2-${topicSuffix}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'thanks',
        },
        async (payload) => {
          console.log('ありがとうメッセージの追加を検出:', payload)
          
          // 自分宛のありがとうメッセージの場合のみ通知（送信者がパートナーの場合）
          if (payload.new.to_id === user.id) {
            try {
              // 送信者の表示名を補完するため、JOIN相当の選択で再取得
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
                message: `${payload.new.message ?? ''}`,
                type: 'success',
                userId: user.id,
                source: 'partner',
              })
            }
          }
        }
      )
      .subscribe()

    // クリーンアップ関数
    return () => {
      console.log('リアルタイム通知の監視を停止します...')
      supabase.removeChannel(choresChannel)
      supabase.removeChannel(thanksChannel)
      initializedRef.current = false
    }
  }, [user, supabase, addNotification])

  const value = {
    notifications,
    filteredNotifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    preferences,
    updatePreference,
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