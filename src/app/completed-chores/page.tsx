'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChoreService, ExtendedChore } from '@/services/choreService'
import { sendThankYou } from '@/services/thankYouService'
import { useAuthState } from '@/hooks/useAuthState'
import Navigation from '@/components/Navigation'
import { ThankYouModal } from '@/components/ThankYouModal'

/**
 * 完了した家事一覧ページ
 * 完了した家事の表示とありがとうメッセージの送信を担当
 */
export default function CompletedChoresPage() {
  const { user } = useAuthState()
  const router = useRouter()
  const [completedChores, setCompletedChores] = useState<ExtendedChore[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedChore, setSelectedChore] = useState<ExtendedChore | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedIcon, setSelectedIcon] = useState<string>('')

  /**
   * 完了した家事を取得
   */
  const fetchCompletedChores = async () => {
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
  }

  /**
   * アイコンボタンクリック時の処理
   */
  const handleIconClick = (chore: ExtendedChore, icon: string) => {
    setSelectedChore(chore)
    setSelectedIcon(icon)
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
      const fullMessage = `${selectedIcon} ${message}`
      
      await sendThankYou(user.id, {
        toUserId,
        choreId: selectedChore.id,
        message: fullMessage
      })
      
      // 完了した家事一覧を再取得
      await fetchCompletedChores()
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
    setSelectedIcon('')
  }

  /**
   * 日付フォーマット
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  useEffect(() => {
    if (user) {
      fetchCompletedChores()
    }
  }, [user])

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-8">
          <p className="text-gray-600">ログインが必要です</p>
          <button 
            onClick={() => router.push('/login')} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            ログインページへ
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto p-4 max-w-4xl pt-20">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">完了した家事</h1>
          <p className="text-gray-600 mt-2">
            完了した家事一覧です。ありがとうメッセージを送ることができます。
          </p>
        </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-gray-600">読み込み中...</span>
        </div>
      ) : completedChores.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="text-center py-8 p-6">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              完了した家事がありません
            </h3>
            <p className="text-gray-600">
              家事を完了すると、ここに表示されます。
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {completedChores.map((chore) => (
            <div key={chore.id} className="bg-green-50 border-green-200 rounded-lg border shadow-sm">
              <div className="p-6">
                {/* H1タイトル */}
                <h1 className="text-2xl font-bold text-green-800 mb-6 text-center">{chore.title}</h1>
                
                {/* アイコンボタン */}
                <div className="flex gap-3 justify-center mb-6">
                  <button
                    onClick={() => handleIconClick(chore, '😊')}
                    disabled={isSending}
                    className="w-12 h-12 bg-yellow-100 hover:bg-yellow-200 rounded-lg flex items-center justify-center text-2xl transition-colors disabled:opacity-50"
                    title="嬉しい"
                  >
                    😊
                  </button>
                  <button
                    onClick={() => handleIconClick(chore, '👍')}
                    disabled={isSending}
                    className="w-12 h-12 bg-blue-100 hover:bg-blue-200 rounded-lg flex items-center justify-center text-2xl transition-colors disabled:opacity-50"
                    title="いいね"
                  >
                    👍
                  </button>
                  <button
                    onClick={() => handleIconClick(chore, '❤️')}
                    disabled={isSending}
                    className="w-12 h-12 bg-red-100 hover:bg-red-200 rounded-lg flex items-center justify-center text-2xl transition-colors disabled:opacity-50"
                    title="愛してる"
                  >
                    ❤️
                  </button>
                  <button
                    onClick={() => handleIconClick(chore, '🙏')}
                    disabled={isSending}
                    className="w-12 h-12 bg-purple-100 hover:bg-purple-200 rounded-lg flex items-center justify-center text-2xl transition-colors disabled:opacity-50"
                    title="お疲れさま"
                  >
                    🙏
                  </button>
                  <button
                    onClick={() => handleIconClick(chore, '🔥')}
                    disabled={isSending}
                    className="w-12 h-12 bg-orange-100 hover:bg-orange-200 rounded-lg flex items-center justify-center text-2xl transition-colors disabled:opacity-50"
                    title="すごい"
                  >
                    🔥
                  </button>
                </div>
                
                {/* 詳細情報 */}
                <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <span>📝</span>
                      <span>家事: {chore.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>⏰</span>
                      <span>作成: {new Date(chore.created_at).toLocaleString('ja-JP')}</span>
                    </div>
                    {chore.completions && chore.completions.length > 0 && (
                      <div className="text-xs text-green-600">
                        ✅ 完了記録: {chore.completions.length} 件
                      </div>
                    )}
                </div>
              </div>
            </div>
          ))}
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
      />
    </div>
  )
}