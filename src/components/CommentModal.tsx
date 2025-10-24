'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface CommentModalProps {
  isOpen: boolean
  onClose: () => void
  onSend: (message: string) => void
  choreTitle: string
  isSending: boolean
}

/**
 * コメント送信用モーダルコンポーネント
 * 通知の完了項目をクリックした時に表示され、コメントを入力できる
 */
export function CommentModal({
  isOpen,
  onClose,
  onSend,
  choreTitle,
  isSending
}: CommentModalProps) {
  const [message, setMessage] = useState('')

  /**
   * コメント送信処理
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
      <div className="bg-card rounded-lg shadow-xl max-w-md w-full">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-foreground">
            コメントを追加
          </h2>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-destructive transition-colors"
            disabled={isSending}
          >
            <X size={24} />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">
              家事: <span className="font-medium text-foreground">{choreTitle}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              完了した家事についてコメントを残すことができます。
            </p>
          </div>

          {/* メッセージ入力 */}
          <div className="mb-6">
            <label htmlFor="comment-message" className="block text-sm font-medium text-muted-foreground mb-2">
              コメント
            </label>
            <textarea
              id="comment-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="コメントを入力してください..."
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              rows={4}
              disabled={isSending}
              maxLength={200}
            />
            <div className="text-right text-xs text-muted-foreground mt-1">
              {message.length}/200
            </div>
          </div>

          {/* ボタン */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleClose}
              disabled={isSending}
              className="px-4 py-2 text-muted-foreground border border-border rounded-md hover:bg-secondary disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              キャンセル
            </button>
            <button
              onClick={handleSend}
              disabled={isSending || !message.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {isSending ? '送信中...' : 'コメント送信'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}