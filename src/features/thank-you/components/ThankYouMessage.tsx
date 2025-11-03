'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { sendThankYou, PREDEFINED_THANK_YOU_MESSAGES } from '@/features/thank-you/services/thankYouService'
import type { ThankYouMessage as ThankYouMessageType } from '@/features/thank-you/services/thankYouService'

interface ThankYouMessageProps {
  choreId: string
  toUserId: string
  toUserName?: string
  onSuccess?: (thankYou: ThankYouMessageType) => void
  onCancel?: () => void
}

/**
 * ありがとうメッセージ送信コンポーネント
 * 家事完了に対してありがとうメッセージを送信する
 */
export default function ThankYouMessage({ 
  choreId, 
  toUserId, 
  toUserName, 
  onSuccess, 
  onCancel 
}: ThankYouMessageProps) {
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  const { user } = useAuth()
  const { addNotification } = useNotifications()

  /**
   * ありがとうメッセージを送信する
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('ログインが必要です')
      return
    }

    if (!message.trim()) {
      setError('メッセージを入力してください')
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccessMessage(null)

    try {
      // thankYouServiceを使用してメッセージを送信
      const thankYou = await sendThankYou(user.id, {
        choreId: parseInt(choreId),
        toUserId,
        message: message.trim()
      })

      // 成功通知を表示
      addNotification({
        title: 'ありがとうメッセージを送信しました',
        message: `${toUserName || '相手'}にありがとうメッセージを送信しました`,
        type: 'success'
      })
      setSuccessMessage('ありがとうメッセージを送信しました')

      // 成功コールバックを実行
      onSuccess?.(thankYou)
      
      // フォームをリセット
      setMessage('')

    } catch (error) {
      console.error('ありがとうメッセージの送信に失敗しました:', error)
      setError(error instanceof Error ? error.message : 'メッセージの送信に失敗しました。もう一度お試しください。')
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * 定型メッセージを選択する
   */
  const selectPredefinedMessage = (predefinedMessage: string) => {
    setMessage(predefinedMessage)
    setSuccessMessage(null)
    }

  return (
    <div className="bg-card rounded-lg shadow-md p-6 max-w-md mx-auto">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        {toUserName ? `${toUserName}さんに` : ''}ありがとうメッセージを送る
      </h3>

      {/* エラーメッセージ */}
      {error && (
        <div
          className="mb-4 p-3 bg-destructive/10 border border-destructive/50 text-destructive rounded"
          role="alert"
          data-testid="error-message"
        >
          {error}
        </div>
      )}

      {/* 成功メッセージ */}
      {successMessage && (
        <div
          className="mb-4 p-3 bg-primary/10 border border-success/50 text-success rounded"
          role="status"
          data-testid="success-message"
        >
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* カスタムメッセージ入力（Tab移動で最初にフォーカスされる順序に配置） */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-muted-foreground mb-2">
            メッセージ
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="ありがとうメッセージを入力してください..."
            rows={3}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            disabled={isSubmitting}
            aria-label="メッセージ"
            data-testid="custom-message-input"
          />
        </div>

        {/* 定型メッセージ選択 */}
        <fieldset>
          <legend className="block text-sm font-medium text-muted-foreground mb-2">
            定型メッセージから選択
          </legend>
          <div className="grid grid-cols-1 gap-2">
            {PREDEFINED_THANK_YOU_MESSAGES.map((predefinedMessage, index) => (
              <button
                key={index}
                type="button"
                onClick={() => selectPredefinedMessage(predefinedMessage)}
                className="text-left p-2 text-sm bg-secondary hover:bg-secondary/80 rounded border border-border transition-colors"
                aria-label={`定型メッセージを選択: ${predefinedMessage}`}
                data-testid={`predefined-message-${index}`}
              >
                {predefinedMessage}
              </button>
            ))}
          </div>
        </fieldset>

        {/* アクションボタン */}
        <div className="flex gap-3 pt-4">
          {/* 視覚的には非表示だが説明文として関連付ける */}
          <span id="send-thank-you-desc" className="sr-only">
            ありがとうメッセージを送信します
          </span>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            data-testid="send-thank-you-button"
            aria-describedby="send-thank-you-desc"
          >
            {isSubmitting ? '送信中...' : '送信する'}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 bg-secondary text-muted-foreground py-2 px-4 rounded-md hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              キャンセル
            </button>
          )}
        </div>
      </form>
    </div>
  )
}