'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getThankYouHistory, sendThankYouForChore } from '@/features/thank-you/services/thankYouService'
import type { ThankYouMessage } from '@/features/thank-you/services/thankYouService'
import { AlertTriangle, Heart } from 'lucide-react'

interface ThankYouHistoryProps {
  /** 特定の家事IDを指定した場合、その家事に関する感謝メッセージのみ表示 */
  choreId?: string
  /** 表示する最大件数（デフォルト: 10） */
  limit?: number
  /** 空の状態の表示メッセージ */
  emptyMessage?: string
  /** コンパクト表示モード */
  compact?: boolean
}

/**
 * 感謝メッセージ履歴表示コンポーネント
 * ユーザーが送受信した感謝メッセージの履歴を表示する
 */
export default function ThankYouHistory({
  choreId,
  limit = 10,
  emptyMessage = '感謝メッセージがまだありません',
  compact = false
}: ThankYouHistoryProps) {
  const [thankYouMessages, setThankYouMessages] = useState<ThankYouMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { user } = useAuth()

  /**
   * 感謝メッセージ履歴を取得する
   */
  const fetchThankYouHistory = useCallback(async () => {
    if (!user) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      let messages: ThankYouMessage[]
      
      if (choreId) {
        // 特定の家事に関する感謝メッセージを取得
        // 特定の家事に関する感謝メッセージを取得する機能は後で実装
        // 現在は全体履歴を取得（chore_idフィールドがまだ実装されていないため）
        messages = await getThankYouHistory(user.id, { limit })
      } else {
        // 全体の感謝メッセージ履歴を取得
        messages = await getThankYouHistory(user.id, { limit })
      }
      
      setThankYouMessages(messages)
    } catch (error) {
      console.error('感謝メッセージ履歴の取得に失敗しました:', error)
      setError('感謝メッセージの取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }, [user, choreId, limit])

  useEffect(() => {
    fetchThankYouHistory()
  }, [fetchThankYouHistory])

  /**
   * 日時をフォーマットする
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      return 'たった今'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}時間前`
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}日前`
    } else {
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
  }

  /**
   * メッセージの送信者/受信者を判定する
   */
  const getMessageDirection = (message: ThankYouMessage) => {
    return message.from_id === user?.id ? 'sent' : 'received'
  }

  if (isLoading) {
    return (
      <div className={`${compact ? 'p-4' : 'p-6'} text-center`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">読み込み中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${compact ? 'p-4' : 'p-6'} text-center`}>
        <div className="text-destructive mb-4">
          <AlertTriangle className="w-12 h-12 mx-auto mb-2" aria-hidden="true" />
          <p>{error}</p>
        </div>
        <button
          onClick={fetchThankYouHistory}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          再試行
        </button>
      </div>
    )
  }

  if (thankYouMessages.length === 0) {
    return (
      <div className={`${compact ? 'p-4' : 'p-6'} text-center text-muted-foreground`}>
        <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" aria-hidden="true" />
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {thankYouMessages.map((message) => {
        const direction = getMessageDirection(message)
        const isReceived = direction === 'received'
        
        return (
          <div
            key={message.id}
            className={`${compact ? 'p-3' : 'p-4'} rounded-lg border ${
              isReceived 
                ? 'bg-info/10 border-info/30' 
                : 'bg-primary/10 border-success/30'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    isReceived 
                      ? 'bg-info/20 text-info' 
                      : 'bg-primary/20 text-success'
                  }`}>
                    {isReceived ? '受信' : '送信'}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(message.created_at)}
                  </span>
                </div>
                
                <p className={`${compact ? 'text-sm' : 'text-base'} text-foreground mb-2`}>
                  {message.message}
                </p>
                
                {!compact && message.chore && (
                <p className="text-xs text-muted-foreground">
                  家事: {message.chore.title}
                </p>
              )}
              </div>
              
              <div className="ml-4">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isReceived ? 'bg-info/20' : 'bg-primary/20'
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 ${
                      isReceived ? 'text-info' : 'text-success'
                    }`}
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>
          </div>
        )
      })}
      
      {!compact && thankYouMessages.length >= limit && (
        <div className="text-center pt-4">
          <p className="text-sm text-muted-foreground">
            {limit}件まで表示しています
          </p>
        </div>
      )}
    </div>
  )
}
