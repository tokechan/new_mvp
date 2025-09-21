'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
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

  // 新しい通知を追加する関数
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
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
    if (!user) return

    console.log('リアルタイム通知の監視を開始します...')

    // 家事の変更を監視
    const choresChannel = supabase
      .channel('chores-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chores',
        },
        (payload) => {
          console.log('家事データの変更を検出:', payload)
          
          switch (payload.eventType) {
            case 'INSERT':
              addNotification({
                title: '新しい家事が追加されました',
                message: `${payload.new.title}が追加されました`,
                type: 'info',
                userId: user.id,
              })
              break
            case 'UPDATE':
              if (payload.new.completed && !payload.old.completed) {
                addNotification({
                  title: '家事が完了しました',
                  message: `${payload.new.title}が完了されました`,
                  type: 'success',
                  userId: user.id,
                })
              }
              break
            case 'DELETE':
              addNotification({
                title: '家事が削除されました',
                message: `家事が削除されました`,
                type: 'warning',
                userId: user.id,
              })
              break
          }
        }
      )
      .subscribe()

    // ありがとうメッセージの変更を監視
    const thanksChannel = supabase
      .channel('thanks-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'thanks',
        },
        (payload) => {
          console.log('ありがとうメッセージの追加を検出:', payload)
          
          // 自分宛のありがとうメッセージの場合のみ通知
          if (payload.new.to_user === user.id) {
            addNotification({
              title: 'ありがとうメッセージを受け取りました',
              message: `${payload.new.message}`,
              type: 'success',
              userId: user.id,
            })
          }
        }
      )
      .subscribe()

    // クリーンアップ関数
    return () => {
      console.log('リアルタイム通知の監視を停止します...')
      supabase.removeChannel(choresChannel)
      supabase.removeChannel(thanksChannel)
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