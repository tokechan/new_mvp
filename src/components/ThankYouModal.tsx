'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface ThankYouModalProps {
  isOpen: boolean
  onClose: () => void
  onSend: (message: string) => void
  choreTitle: string
  isSending: boolean
}

/**
 * ありがとうメッセージ送信用モーダルコンポーネント
 * アイコンボタンクリック時に表示され、カスタムメッセージを入力できる
 */
export function ThankYouModal({
  isOpen,
  onClose,
  onSend,
  choreTitle,
  isSending
}: ThankYouModalProps) {
  const [message, setMessage] = useState('')

  /**
   * メッセージ送信処理
   */
  const handleSend = () => {
    if (message.trim()) {
      onSend(message.trim())
      setMessage('')
      onClose()
    }
  }

  /**
   * モーダルを閉じる処理
   */
  const handleClose = () => {
    setMessage('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            ありがとうメッセージ
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSending}
          >
            <X size={24} />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              家事: <span className="font-medium text-gray-800">{choreTitle}</span>
            </p>
          </div>

          {/* メッセージ入力 */}
          <div className="mb-6">
            <label htmlFor="thank-you-message" className="block text-sm font-medium text-gray-700 mb-2">
              メッセージ
            </label>
            <textarea
              id="thank-you-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="ありがとうメッセージを入力してください..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
              rows={4}
              disabled={isSending}
              maxLength={200}
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              {message.length}/200
            </div>
          </div>

          {/* ボタン */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleClose}
              disabled={isSending}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleSend}
              disabled={isSending || !message.trim()}
              className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 disabled:opacity-50 transition-colors"
            >
              {isSending ? '送信中...' : '送信'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}