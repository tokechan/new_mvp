'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/Button'

interface UnreadStamp {
  id: string
  type: 'completion' | 'thanks'
  title: string
  message: string
  timestamp: Date
  choreId?: string
}

interface UnreadStampPopupProps {
  /** 未読スタンプのリスト */
  stamps: UnreadStamp[]
  /** ポップアップの表示状態 */
  isOpen: boolean
  /** ポップアップを閉じる関数 */
  onClose: () => void
  /** スタンプを既読にする関数 */
  onMarkAsRead: (stampId: string) => void
  /** 全てのスタンプを既読にする関数 */
  onMarkAllAsRead: () => void
}

/**
 * 未読スタンプを集約して表示するポップアップコンポーネント
 * 家事完了やありがとうメッセージの通知を1枚のポップアップで表示
 */
export function UnreadStampPopup({
  stamps,
  isOpen,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead
}: UnreadStampPopupProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  // ポップアップが開かれた時にアニメーションを開始
  useEffect(() => {
    if (isOpen && stamps.length > 0) {
      setCurrentIndex(0)
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen, stamps.length])

  /**
   * 次のスタンプに移動
   */
  const handleNext = () => {
    if (currentIndex < stamps.length - 1) {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1)
        setIsAnimating(false)
      }, 150)
    }
  }

  /**
   * 前のスタンプに移動
   */
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentIndex(prev => prev - 1)
        setIsAnimating(false)
      }, 150)
    }
  }

  /**
   * 現在のスタンプを既読にして次に進む
   */
  const handleMarkCurrentAsRead = () => {
    const currentStamp = stamps[currentIndex]
    if (currentStamp) {
      onMarkAsRead(currentStamp.id)
      if (currentIndex < stamps.length - 1) {
        handleNext()
      } else {
        onClose()
      }
    }
  }

  /**
   * スタンプタイプに応じたアイコンを取得
   */
  const getStampIcon = (type: UnreadStamp['type']) => {
    switch (type) {
      case 'completion':
        return (
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )
      case 'thanks':
        return (
          <div className="w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
          </div>
        )
      default:
        return null
    }
  }

  /**
   * 時刻をフォーマット
   */
  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isOpen || stamps.length === 0) return null

  const currentStamp = stamps[currentIndex]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-semibold text-gray-900">
            新しい通知
          </DialogTitle>
        </DialogHeader>

        <div className="py-6">
          {/* スタンプ表示エリア */}
          <div className={`text-center transition-all duration-300 ${isAnimating ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
            <div className="flex justify-center mb-4">
              {getStampIcon(currentStamp.type)}
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {currentStamp.title}
            </h3>
            
            <p className="text-gray-600 mb-4">
              {currentStamp.message}
            </p>
            
            <p className="text-sm text-gray-400">
              {formatTime(currentStamp.timestamp)}
            </p>
          </div>

          {/* ページネーション */}
          {stamps.length > 1 && (
            <div className="flex justify-center items-center mt-6 space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="w-8 h-8 p-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Button>
              
              <span className="text-sm text-gray-500">
                {currentIndex + 1} / {stamps.length}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={currentIndex === stamps.length - 1}
                className="w-8 h-8 p-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </div>
          )}
        </div>

        {/* アクションボタン */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            後で確認
          </Button>
          
          <Button
            onClick={handleMarkCurrentAsRead}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90"
          >
            確認
          </Button>
          
          {stamps.length > 1 && (
            <Button
              onClick={() => {
                onMarkAllAsRead()
                onClose()
              }}
              className="w-full sm:w-auto bg-gray-600 hover:bg-gray-700"
            >
              全て確認
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}