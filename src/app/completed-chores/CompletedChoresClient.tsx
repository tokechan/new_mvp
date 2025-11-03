'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChoreService, ExtendedChore } from '@/services/choreService'
import { sendThankYou } from '@/services/thankYouService'
import { useAuthState } from '@/hooks/useAuthState'
import { ThankYouModal, type ThankYouReaction } from '@/features/thank-you/components/ThankYouModal'
import { Smile, ThumbsUp, Heart, Handshake, Flame, Clock, Home, CheckCircle2, FileText, ClipboardList } from 'lucide-react'
import { useToast } from '@/shared/ui/toast'
import { Button } from '@/shared/ui/Button'
import { cn } from '@/lib/utils'

/**
 * 完了した家事一覧ページ
 * 完了した家事の表示とありがとうメッセージの送信を担当
 */
type ReactionOption = ThankYouReaction & { key: string }

const REACTIONS: ReactionOption[] = [
  { key: 'smile', label: '嬉しい', Icon: Smile },
  { key: 'thumbs', label: 'いいね', Icon: ThumbsUp },
  { key: 'heart', label: '愛してる', Icon: Heart },
  { key: 'handshake', label: 'お疲れさま', Icon: Handshake },
  { key: 'flame', label: 'すごい', Icon: Flame },
]

function CompletedChoresPageInner() {
  const { user } = useAuthState()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const [completedChores, setCompletedChores] = useState<ExtendedChore[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedChore, setSelectedChore] = useState<ExtendedChore | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedReaction, setSelectedReaction] = useState<ThankYouReaction | null>(null)
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null)

  const highlightParam = searchParams.get('highlight')

  useEffect(() => {
    if (highlightParam) {
      setActiveHighlightId(highlightParam)
    }
  }, [highlightParam])

  /**
   * 完了した家事を取得
   */
  const fetchCompletedChores = useCallback(async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const chores = await ChoreService.getCompletedChores(user.id)
      setCompletedChores(chores)
    } catch (error) {
      console.error('完了した家事の取得に失敗:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  /**
   * アイコンボタンクリック時の処理
   */
  const handleIconClick = (chore: ExtendedChore, reaction: ReactionOption) => {
    setSelectedChore(chore)
    setSelectedReaction(reaction)
    setIsModalOpen(true)
  }

  /**
   * ありがとうメッセージを送信
   */
  const handleSendThankYou = async (message: string) => {
    if (!user || !selectedChore || !message.trim()) return

    try {
      setIsSending(true)
      const toUserId = selectedChore.owner_id === user.id ? selectedChore.partner_id : selectedChore.owner_id
      if (!toUserId) {
        throw new Error('送信先ユーザーが見つかりません')
      }

      // アイコンとメッセージを組み合わせて送信
      const prefix = selectedReaction ? `【${selectedReaction.label}】 ` : ''
      const fullMessage = `${prefix}${message}`

      await sendThankYou(user.id, {
        toUserId,
        choreId: selectedChore.id,
        message: fullMessage
      })

      // 完了した家事一覧を再取得
      await fetchCompletedChores()

      // 送信確認トーストを表示
      showToast({ message: 'メッセージが送信されました', variant: 'success' })
    } catch (error) {
      console.error('ありがとうメッセージの送信に失敗:', error)
    } finally {
      setIsSending(false)
    }
  }

  /**
   * モーダルを閉じる処理
   */
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedChore(null)
    setSelectedReaction(null)
  }

  /**
   * 日付フォーマット
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  useEffect(() => {
    if (user) {
      fetchCompletedChores()
    }
  }, [user, fetchCompletedChores])

  useEffect(() => {
    if (!isLoading && activeHighlightId) {
      const targetId = `completed-chore-${activeHighlightId}`
      const element = document.getElementById(targetId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      const timer = setTimeout(() => {
        setActiveHighlightId(null)
        router.replace('/completed-chores', { scroll: false })
      }, 4000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [isLoading, activeHighlightId, router])

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-8">
          <p className="text-muted-foreground">ログインが必要です</p>
          <button 
            onClick={() => router.push('/auth/signin')} 
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            ログインページへ
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center">
            <CheckCircle2 className="w-6 h-6 mr-2 text-primary" aria-hidden="true" />
            完了した家事
          </h1>
          <p className="text-muted-foreground">
            完了した家事一覧です。ありがとうメッセージを送ることができます。
          </p>
        </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-muted-foreground">読み込み中...</span>
        </div>
      ) : completedChores.length === 0 ? (
        <div className="bg-card rounded-lg border border-border shadow-sm">
          <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary shadow-sm">
              <ClipboardList className="h-7 w-7" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              完了した家事がありません
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              家事を完了すると、ここに表示されます。
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {completedChores.map((chore) => {
            const isHighlighted = activeHighlightId === String(chore.id)
            return (
            <div
              key={chore.id}
              id={`completed-chore-${chore.id}`}
              tabIndex={-1}
              className={cn(
                'bg-card border border-border rounded-lg shadow-sm transition-shadow duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                isHighlighted && 'ring-2 ring-primary/60 shadow-lg'
              )}
            >
              <div className="p-6">
                {/* カードヘッダー：タイトル + 完了バッジ + 日付 */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-foreground break-words whitespace-normal">{chore.title}</h2>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/40 backdrop-blur-sm">
                      完了済み
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(
                        (chore.completions && chore.completions.length > 0
                          ? new Date(Math.max(...chore.completions.map((c: any) => new Date(c.created_at).getTime()))).toISOString()
                          : chore.created_at
                        ) as any
                      )}
                    </span>
                  </div>
                </div>

                {/* リアクションボタン */}
                <div className="flex flex-wrap gap-3 justify-center mb-4">
                  {REACTIONS.map((reaction) => {
                    const Icon = reaction.Icon
                    return (
                      <Button
                        key={`${chore.id}-${reaction.key}`}
                        onClick={() => handleIconClick(chore, reaction)}
                        disabled={isSending}
                        size="icon"
                        className="h-10 w-10 rounded-full p-0 grid place-items-center bg-primary/10 border border-primary/40 text-primary hover:bg-primary/20 hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        title={reaction.label}
                        aria-label={reaction.label}
                      >
                        <Icon className="w-5 h-5" aria-hidden="true" />
                      </Button>
                    )
                  })}
                </div>

                {/* 詳細情報 */}
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-foreground" aria-hidden="true" />
                    <span>家事: {chore.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-foreground" aria-hidden="true" />
                    <span>完了: {formatDate(
                      (chore.completions && chore.completions.length > 0
                        ? new Date(Math.max(...chore.completions.map((c: any) => new Date(c.created_at).getTime()))).toISOString()
                        : chore.created_at
                      ) as any
                    )}</span>
                  </div>
                </div>
              </div>
            </div>
            )
          })}

          {/* リスト最下部：ホームへ戻るボタン */}
          <div className="flex justify-center pt-4 pb-6">
            <Button
              type="button"
              onClick={() => router.push('/app')}
              size="icon"
              className="h-12 w-12 rounded-full p-0 grid place-items-center text-primary border border-primary/40 bg-primary/10 hover:bg-primary/20 hover:border-primary/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="ホームへ戻る"
            >
              <Home className="w-6 h-6" aria-hidden="true" />
              <span className="sr-only">ホームへ戻る</span>
            </Button>
          </div>

        </div>
      )}
      </div>

      {/* ありがとうメッセージモーダル */}
      <ThankYouModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSend={handleSendThankYou}
        choreTitle={selectedChore?.title || ''}
        isSending={isSending}
        selectedReaction={selectedReaction || undefined}
      />
    </div>
  )
}

export default function CompletedChoresPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12">読み込み中...</div>}>
      <CompletedChoresPageInner />
    </Suspense>
  )
}
