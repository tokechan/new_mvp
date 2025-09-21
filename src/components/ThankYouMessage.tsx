'use client'

import React, { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationContext'

interface ThankYouMessageProps {
  completionId: string
  toUserId: string
  toUserName?: string
  onSuccess?: () => void
  onCancel?: () => void
}

/**
 * ありがとうメッセージ送信コンポーネント
 * 家事完了に対してありがとうメッセージを送信する
 */
export default function ThankYouMessage({ 
  completionId, 
  toUserId, 
  toUserName, 
  onSuccess, 
  onCancel 
}: ThankYouMessageProps) {
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { user } = useAuth()
  const { addNotification } = useNotifications()
  const supabase = createSupabaseBrowserClient()

  // 定型メッセージのオプション
  const predefinedMessages = [
    'ありがとうございます！',
    'お疲れさまでした！',
    'とても助かりました！',
    'いつもありがとう！',
    '素晴らしい仕事でした！'
  ]

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

    try {
      // ありがとうメッセージをデータベースに保存
      const { error: insertError } = await supabase
        .from('thanks')
        .insert({
          completion_id: completionId,
          from_user: user.id,
          to_user: toUserId,
          message: message.trim()
        })

      if (insertError) {
        throw insertError
      }

      // 成功通知を表示
      addNotification({
        title: 'ありがとうメッセージを送信しました',
        message: `${toUserName || '相手'}にありがとうメッセージを送信しました`,
        type: 'success'
      })

      // 成功コールバックを実行
      onSuccess?.()
      
      // フォームをリセット
      setMessage('')
      
    } catch (error) {
      console.error('ありがとうメッセージの送信に失敗しました:', error)
      setError('メッセージの送信に失敗しました。もう一度お試しください。')
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * 定型メッセージを選択する
   */
  const selectPredefinedMessage = (predefinedMessage: string) => {
    setMessage(predefinedMessage)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {toUserName ? `${toUserName}さんに` : ''}ありがとうメッセージを送る
      </h3>

      {/* エラーメッセージ */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 定型メッセージ選択 */}
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-2">
            定型メッセージから選択
          </legend>
          <div className="grid grid-cols-1 gap-2">
            {predefinedMessages.map((predefinedMessage, index) => (
              <button
                key={index}
                type="button"
                onClick={() => selectPredefinedMessage(predefinedMessage)}
                className="text-left p-2 text-sm bg-gray-50 hover:bg-gray-100 rounded border transition-colors"
              >
                {predefinedMessage}
              </button>
            ))}
          </div>
        </fieldset>

        {/* カスタムメッセージ入力 */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            メッセージ
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="ありがとうメッセージを入力してください..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSubmitting}
          />
        </div>

        {/* アクションボタン */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting || !message.trim()}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? '送信中...' : '送信する'}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              キャンセル
            </button>
          )}
        </div>
      </form>
    </div>
  )
}