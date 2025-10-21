'use client'

import { useState } from 'react'
import { Undo2, Send } from 'lucide-react'
import { Button } from '@/components/ui/Button'

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
        <div className="flex items-center justify-center p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            メッセージを送る
          </h2>
        </div>

        {/* コンテンツ */}
        <div className="p-6">
          <div className="mb-4 flex justify-center">
            <p className="text-sm sm:text-base text-gray-600 mb-2 text-center">
              家事: <span className="font-medium text-gray-800 break-words inline-block max-w-[80vw] sm:max-w-md">{choreTitle}</span>
            </p>
          </div>

          {/* メッセージ入力 */}
          <div className="mb-6">
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

          {/* ボタン（アイコン） */}
          <div className="flex items-center justify-center gap-3">
            <Button
              aria-label="キャンセル"
              onClick={handleClose}
              disabled={isSending}
              size="icon"
              className="h-12 w-12 rounded-full p-0 grid place-items-center bg-slate-200 text-slate-800 hover:bg-slate-300 disabled:opacity-50"
            >
              <Undo2 className="w-6 h-6" aria-hidden="true" />
              <span className="sr-only">キャンセル</span>
            </Button>
            <Button
              aria-label="送信"
              onClick={handleSend}
              disabled={isSending || !message.trim()}
              size="icon"
              className="h-12 w-12 rounded-full p-0 grid place-items-center bg-pink-500 text-white hover:bg-pink-600 disabled:opacity-50"
            >
              {isSending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-6 h-6" aria-hidden="true" />
              )}
              <span className="sr-only">送信</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}