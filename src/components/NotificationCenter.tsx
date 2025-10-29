'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useNotifications, Notification } from '@/contexts/NotificationContext'
import ThankYouCelebration from '@/components/ThankYouCelebration'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

/**
 * 通知センターコンポーネント
 * 通知の一覧表示、既読管理、削除機能を提供
 */
export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const [activePopoverId, setActivePopoverId] = useState<string | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrationMessage, setCelebrationMessage] = useState('')
  const router = useRouter()
  const { user } = useAuth()
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
  } = useNotifications()
  const isAuthenticated = Boolean(user)

  useEffect(() => {
    if (!isAuthenticated) {
      setIsOpen(false)
      setActivePopoverId(null)
    }
  }, [isAuthenticated])

  // 通知アイコンの色を決定
  const getNotificationIconColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'text-success'
      case 'warning':
        return 'text-warning'
      case 'error':
        return 'text-destructive'
      default:
        return 'text-info'
    }
  }

  // 通知の背景色を決定
  const getNotificationBgColor = (type: Notification['type'], read: boolean) => {
    const baseColor = read ? 'bg-muted' : 'bg-card'
    const borderColor = read ? 'border-border' : 'border-primary/30'
    
    switch (type) {
      case 'success':
        return `${baseColor} ${read ? 'border-border' : 'border-success/40'}`
      case 'warning':
        return `${baseColor} ${read ? 'border-border' : 'border-warning/40'}`
      case 'error':
        return `${baseColor} ${read ? 'border-border' : 'border-destructive/40'}`
      default:
        return `${baseColor} ${borderColor}`
    }
  }

  // 通知をクリックした時の処理
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }

    // ありがとう通知はフルスクリーンの祝福オーバーレイを表示
    if (notification.title.includes('ありがとうメッセージ')) {
      setActivePopoverId(null)
      setIsOpen(false) // 通知一覧は閉じる
      setCelebrationMessage(notification.message || 'ありがとう！')
      setShowCelebration(true)
      return
    }
    
    // アクションURLがある場合はページ遷移
    if (notification.actionUrl) {
      setIsOpen(false) // モーダルを閉じる
      router.push(notification.actionUrl)
    }
  }



  // 時間の表示フォーマット
  const formatTime = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return 'たった今'
    if (minutes < 60) return `${minutes}分前`
    if (hours < 24) return `${hours}時間前`
    return `${days}日前`
  }

  return (
    <div className="relative" data-testid="notification-center">
      {/* 通知ベルアイコン */}
      <button
        type="button"
        onClick={() => {
          if (isAuthenticated) {
            setIsOpen((prev) => !prev)
          }
        }}
        disabled={!isAuthenticated}
        aria-disabled={!isAuthenticated}
        className={cn(
          'relative p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring',
          isAuthenticated
            ? 'text-muted-foreground hover:text-foreground'
            : 'cursor-default text-muted-foreground/60 opacity-60 focus:ring-0'
        )}
        aria-label="通知を開く"
      >
        {/* ベルアイコン（SVG） */}
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        
        {/* 未読通知数のバッジ */}
        {isAuthenticated && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* 通知パネル */}
      {isAuthenticated && isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={() => { setIsOpen(false); setActivePopoverId(null); }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsOpen(false)
              setActivePopoverId(null)
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="通知パネルを閉じる"
        >
          <div 
            className="bg-card rounded-lg shadow-xl border border-border w-full max-w-2xl max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation()
              }
            }}
            role="button"
            tabIndex={0}
          >
          {/* ヘッダー */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">通知</h3>
            <div className="flex space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-primary hover:text-primary/80"
                >
                  全て既読
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="text-muted-foreground hover:text-destructive"
                >
                  全て削除
                </button>
              )}
            </div>
          </div>

          {/* フィルタ設定はシンプル方針のため非表示（パートナーのみ追加済み） */}

          {/* 通知リスト */}
          <div className="max-h-[60vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                通知はありません
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-border cursor-pointer hover:bg-muted ${getNotificationBgColor(notification.type, notification.read)}`}
                  onClick={() => handleNotificationClick(notification)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleNotificationClick(notification)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`通知: ${notification.title}`}
                >
                  <div className="flex items-start space-x-3">
                    {/* 通知タイプアイコン */}
                    <div className={`flex-shrink-0 ${getNotificationIconColor(notification.type)}`}>
                      {notification.type === 'success' && (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                      {notification.type === 'warning' && (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                      {notification.type === 'error' && (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                      {notification.type === 'info' && (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>

                    {/* 通知内容 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${notification.read ? 'text-muted-foreground' : 'text-foreground'}`}>
                          {notification.title}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeNotification(notification.id)
                          }}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label="通知を削除"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                      {/* ありがとう通知はコメントを一覧では表示しない */}
                      {notification.title.includes('ありがとうメッセージ') ? (
                        <p className="text-sm text-muted-foreground">タップ／クリックでコメントを表示</p>
                      ) : (
                        <p className={`text-sm ${notification.read ? 'text-muted-foreground' : 'text-foreground'}`}>
                          {notification.message}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTime(notification.timestamp)}
                      </p>
                    </div>

                    {/* 未読インジケーター */}
                    {!notification.read && (
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-info rounded-full"></div>
                      </div>
                    )}
                  </div>

                  {/* ありがとう通知のコメントポップオーバーは廃止（フルスクリーン演出へ変更） */}
                </div>
              ))
            )}
          </div>
          </div>
        </div>
      )}
      {/* ありがとう祝福オーバーレイ */}
      <ThankYouCelebration
        open={showCelebration}
        message={celebrationMessage}
        onClose={() => setShowCelebration(false)}
      />
    </div>
  )
}
