'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/card'
import { ChoreCompletionModal } from '@/components/ChoreCompletionModal'
import { CongratulationsModal } from '@/components/CongratulationsModal'
import ThankYouMessage from './ThankYouMessage'
import { Chore } from '@/types/chore'
import { RotateCcw, Heart, Trash2, Check } from 'lucide-react'

interface ChoreItemProps {
  chore: Chore
  onToggle: (choreId: string, currentDone: boolean) => Promise<void>
  onDelete: (choreId: string) => Promise<void>
  isOwnChore: boolean
  partnerName: string
  showThankYou: boolean
  onShowThankYou: () => void
  onHideThankYou: () => void
  partnerInfo: any
  currentUserId?: string
}

export function ChoreItem({ 
  chore, 
  onToggle, 
  onDelete, 
  isOwnChore, 
  partnerName, 
  showThankYou, 
  onShowThankYou, 
  onHideThankYou, 
  partnerInfo,
  currentUserId 
}: ChoreItemProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [showCongratulationsModal, setShowCongratulationsModal] = useState(false)
  const router = useRouter()

  /**
   * 家事の完了/未完了を切り替える
   */
  const handleToggle = async () => {
    if (isLoading) return

    if (!chore.done) {
      // 未完了の場合はモーダルを表示
      setShowCompletionModal(true)
    } else {
      // 完了済みの場合は直接未完了に戻す
      setIsLoading(true)
      try {
        await onToggle(chore.id as any, !!chore.done)
      } catch (error) {
        console.error('家事の状態更新に失敗しました:', error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  /**
   * モーダルからの完了処理
   */
  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await onToggle(chore.id as any, !!chore.done)
      setShowCompletionModal(false)
      // 完了後に「お疲れ様でした！」モーダルを表示
      setShowCongratulationsModal(true)
    } catch (error) {
      console.error('家事の完了に失敗しました:', error)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 完了日時のフォーマット
   */
  const formatCompletionDate = () => {
    if (!chore.completed_at) return ''
    
    const date = new Date(chore.completed_at)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      return '1時間以内'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}時間前`
    } else {
      return date.toLocaleDateString('ja-JP', {
        month: 'short',
        day: 'numeric'
      })
    }
  }

  /**
   * ありがとうページに遷移する
   */
  const handleThankYou = () => {
    router.push(`/thank-you?choreId=${chore.id}`)
  }

  return (
    <>
      <Card className={`
        p-4 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.99]
        cursor-pointer shadow-sm sm:shadow-md border-0
        ${chore.done 
          ? 'bg-green-50 shadow-green-100/70 completion-animation' 
          : 'bg-white hover:shadow-lg'
        }
        rounded-xl
      `}>
        <div className="flex flex-col gap-3">
          {/* 家事タイトルと完了情報（上部テキストコンテンツ） */}
          <div className="w-full">
            <h3 className={`
              font-medium transition-all duration-200 break-words whitespace-normal text-center
              ${chore.done ? 'line-through text-green-700' : 'text-gray-900'}
            `}>
              {chore.title}
            </h3>
            {chore.done && chore.completed_at && (
              <div className="flex items-center justify-center mt-2 animate-fade-in">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                  <span className="mr-1">✨</span>
                  {formatCompletionDate()}に完了
                </span>
              </div>
            )}
          </div>

          {/* ボタン群（下部） */}
          <div className="grid grid-cols-2 gap-2 w-full">
            {/* 完了/未完了ボタン */}
            <Button
              type="button"
              data-testid="toggle-chore-button"
              onClick={handleToggle}
              disabled={isLoading}
              variant={chore.done ? "outline" : "default"}
              size="sm"
              aria-label={chore.done ? '未完了に戻す' : '完了する'}
              className={`
                text-xs sm:text-sm px-3 sm:px-4 py-2 font-medium transition-all duration-200 w-full
                ${chore.done 
                  ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100 hover:border-green-400' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                }
                ${isLoading ? 'opacity-60 cursor-not-allowed transform scale-95' : 'hover:transform hover:scale-105'}
                focus:ring-2 focus:ring-offset-2 ${chore.done ? 'focus:ring-green-500' : 'focus:ring-blue-500'}
              `}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  処理中...
                </>
              ) : (
                <>
                  {chore.done ? (
                    <>
                      <RotateCcw className="w-[19px] h-[19px] sm:w-4 sm:h-4 mr-1" aria-hidden="true" />
                      <span className="hidden sm:inline">未完了に戻す</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-[19px] h-[19px] sm:w-4 sm:h-4 mr-1" aria-hidden="true" />
                      <span className="hidden sm:inline">完了する</span>
                    </>
                  )}
                </>
              )}
            </Button>

            {/* ありがとうボタン */}
            {chore.done && !isOwnChore && (
              <Button
                variant="outline"
                size="sm"
                aria-label="ありがとう"
                onClick={onShowThankYou}
                className="
                  bg-pink-50 border-pink-300 text-pink-700 hover:bg-pink-100 hover:border-pink-400
                  text-xs sm:text-sm px-3 sm:px-4 py-2 font-medium transition-all duration-200 w-full
                  hover:transform hover:scale-105 focus:ring-2 focus:ring-offset-2 focus:ring-pink-500
                  shadow-sm hover:shadow-md
                "
              >
                <Heart className="w-[19px] h-[19px] sm:w-4 sm:h-4 mr-1" aria-hidden="true" />
                <span className="hidden sm:inline">ありがとう</span>
              </Button>
            )}

            {/* 削除ボタン（パートナー家事でも表示） */}
            <Button
              variant="outline"
              size="sm"
              aria-label="削除"
              onClick={() => onDelete(chore.id as any)}
              className="
                text-xs sm:text-sm px-3 sm:px-4 py-2 font-medium transition-all duration-200 w-full
                border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300
                hover:transform hover:scale-105 focus:ring-2 focus:ring-offset-2 focus:ring-red-500
                shadow-sm hover:shadow-md
              "
            >
              <Trash2 className="w-[19px] h-[19px] sm:w-4 sm:h-4 mr-1" aria-hidden="true" />
              <span className="hidden sm:inline">削除</span>
            </Button>
          </div>
        </div>
        {/* ありがとうメッセージフォーム */}
        {showThankYou && (
          <div className="mt-4 pt-4 border-t">
            <ThankYouMessage
              choreId={String(chore.id)}
              toUserId={partnerInfo?.id || ''}
              toUserName={partnerInfo?.name || 'パートナー'}
              onSuccess={onHideThankYou}
              onCancel={onHideThankYou}
            />
          </div>
        )}
      </Card>

      {/* 完了モーダル */}
      <ChoreCompletionModal
          isOpen={showCompletionModal}
          onClose={() => setShowCompletionModal(false)}
          chore={chore}
          onConfirm={handleConfirm}
        />

      {/* お疲れ様でした！モーダル */}
      <CongratulationsModal
        isOpen={showCongratulationsModal}
        onClose={() => setShowCongratulationsModal(false)}
        chore={chore}
      />
    </>
  )
}