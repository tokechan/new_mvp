'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/card'
import { ChoreCompletionModal } from '@/components/ChoreCompletionModal'
import { CongratulationsModal } from '@/components/CongratulationsModal'
import ThankYouMessage from './ThankYouMessage'
import { Chore } from '@/types/chore'
import { Database } from '@/lib/supabase'
import { RotateCcw, Heart, Check, Sparkles } from 'lucide-react'

type CompletionRecord = Database['public']['Tables']['completions']['Row']

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

  const completions = (chore as Chore & { completions?: CompletionRecord[] }).completions ?? []
  const sortedCompletions = [...completions]
    .filter((c): c is CompletionRecord => !!c && !!c.created_at)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  const latestCompletion = sortedCompletions[0]
  const latestCompletedBy = latestCompletion?.user_id ?? null
  const completionTimestamp = chore.completed_at ?? latestCompletion?.created_at ?? null
  const shouldShowThankButton =
    chore.done &&
    !!latestCompletedBy &&
    !!currentUserId &&
    latestCompletedBy !== currentUserId

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
    if (!completionTimestamp) return ''
    
    const date = new Date(completionTimestamp)
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
          ? 'bg-primary/5 hover:bg-primary/10 hover:shadow-lg completion-animation' 
          : 'bg-taskCompleted'
        }
        rounded-xl
      `}>
        <div className="flex flex-col gap-3">
          {/* 家事タイトルと完了情報（上部テキストコンテンツ） */}
          <div className="w-full">
            <h3 className={`
              font-medium transition-all duration-200 break-words whitespace-normal text-center
              ${chore.done ? 'line-through text-primary' : 'text-foreground'}
            `}>
              {chore.title}
            </h3>
            {/* 完了メタ表示は一旦非表示 */}
          </div>

          {/* ボタン群（下部） */}
          <div className="flex flex-nowrap items-center gap-2 w-full justify-center">
            {/* 完了/未完了ボタン */}

            <Button
              type="button"
              data-testid="toggle-chore-button"
              onClick={handleToggle}
              disabled={isLoading}
              variant={chore.done ? "outline" : "default"}
              size="icon"
              aria-label={chore.done ? '未完了に戻す' : '完了する'}
              className={`${
                chore.done
                  ? 'bg-primary/10 border border-primary/40 text-primary hover:bg-primary/20 hover:border-primary/50'
                  : 'bg-primary/10 border border-primary/40 text-primary hover:bg-primary/20 hover:border-primary/50'
              } h-9 w-9 sm:h-10 sm:w-10 p-0 grid place-items-center transition-all duration-200 ${
                isLoading ? 'opacity-60 cursor-not-allowed transform scale-95' : 'hover:transform hover:scale-105'
              } focus:ring-2 focus:ring-offset-2 focus:ring-primary`}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : chore.done ? (
                <RotateCcw className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Check className="w-5 h-5" aria-hidden="true" />
              )}
              <span className="sr-only">{chore.done ? '未完了に戻す' : '完了する'}</span>
            </Button>


            {shouldShowThankButton && (
              <Button
                asChild
                variant="outline"
                size="icon"
                className="h-9 w-9 sm:h-10 sm:w-10 p-0 grid place-items-center rounded-md bg-primary/10 border border-primary/40 text-primary transition-transform duration-200 hover:-translate-y-0.5 hover:bg-primary/20 hover:border-primary/50 focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-sm"
              >
                <Link
                  href={`/completed-chores?highlight=${chore.id}`}
                  prefetch={false}
                  scroll={false}
                  aria-label="完了した家事の詳細を見る"
                  className="flex items-center justify-center"
                >
                  <Heart className="w-5 h-5" aria-hidden="true" />
                  <span className="sr-only">完了した家事の詳細を見る</span>
                </Link>
              </Button>
            )}



          </div>
        </div>
        {/* ありがとうメッセージフォーム */}
        {showThankYou && (
          <div className="mt-4 pt-4 border-t border-border">
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
