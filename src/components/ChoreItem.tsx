'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/card'
import { ChoreCompletionModal } from '@/components/ChoreCompletionModal'
import ThankYouMessage from './ThankYouMessage'
import { Chore } from '@/types/chore'

interface ChoreItemProps {
  chore: Chore
  onToggle: (choreId: string) => Promise<void>
  onDelete: (choreId: string) => Promise<void>
  isOwnChore: boolean
  partnerName: string
  showThankYou: boolean
  onShowThankYou: () => void
  onHideThankYou: () => void
  partnerInfo: any
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
  partnerInfo 
}: ChoreItemProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
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
        await onToggle(chore.id)
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
      await onToggle(chore.id)
      setShowCompletionModal(false)
      
      // 完了後に完了済み家事ページに遷移
      router.push('/completed-chores')
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
        p-4 transition-all duration-200 hover-lift
        ${chore.done 
          ? 'bg-green-50 border-green-200 completion-animation' 
          : 'bg-white border-gray-200 hover:border-gray-300'
        }
      `}>
        <div className="flex items-center justify-between">
          {/* 家事タイトルと完了情報 */}
          <div className="flex-1">
            <h3 className={`
              font-medium transition-all duration-200
              ${chore.done ? 'line-through text-green-700' : 'text-gray-900'}
            `}>
              {chore.title}
            </h3>
            
            {/* 完了情報 */}
            {chore.done && chore.completed_at && (
              <p className="text-sm text-green-600 mt-1 animate-fade-in">
                {formatCompletionDate()}に完了
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* 完了/未完了ボタン */}
            <Button
              data-testid="toggle-chore-button"
              onClick={handleToggle}
              disabled={isLoading}
              variant={chore.done ? "outline" : "default"}
              size="sm"
              className={`
                text-xs sm:text-sm px-2 sm:px-3
                ${chore.done 
                  ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
                }
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {isLoading ? (
                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
              ) : null}
              {chore.done ? '未完了に戻す' : '完了'}
            </Button>
            
            {/* ありがとうボタン */}
            {chore.done && !isOwnChore && (
              <Button
                variant="outline"
                size="sm"
                onClick={onShowThankYou}
                className="bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100 animate-heart-beat text-xs sm:text-sm px-2 sm:px-3"
              >
                ありがとう
              </Button>
            )}
            
            {/* 削除ボタン */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(chore.id)}
              className="text-xs sm:text-sm px-2 sm:px-3"
            >
              削除
            </Button>
          </div>
        </div>
        
        {/* ありがとうメッセージフォーム */}
        {showThankYou && (
          <div className="mt-4 pt-4 border-t">
            <ThankYouMessage
              choreId={chore.id}
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
    </>
  )
}