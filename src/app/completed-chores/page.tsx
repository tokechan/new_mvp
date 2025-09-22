'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChoreService, ExtendedChore } from '@/services/choreService'
import { sendThankYou, PREDEFINED_THANK_YOU_MESSAGES } from '@/services/thankYouService'
import { useAuthState } from '@/hooks/useAuthState'

/**
 * 完了した家事一覧ページ
 * 完了した家事の表示とありがとうメッセージの送信を担当
 */
export default function CompletedChoresPage() {
  const { user } = useAuthState()
  const router = useRouter()
  const [completedChores, setCompletedChores] = useState<ExtendedChore[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [thankYouMessage, setThankYouMessage] = useState('')
  const [selectedChore, setSelectedChore] = useState<ExtendedChore | null>(null)
  const [isSending, setIsSending] = useState(false)

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
   * ありがとうメッセージを送信
   */
  const handleSendThankYou = async (chore: ExtendedChore, message: string) => {
    if (!user || !message.trim()) return

    try {
      setIsSending(true)
      const toUserId = chore.owner_id === user.id ? chore.partner_id : chore.owner_id
      if (!toUserId) {
        throw new Error('送信先ユーザーが見つかりません')
      }
      
      await sendThankYou(user.id, {
        toUserId,
        choreId: chore.id,
        message: message.trim()
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
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">完了した家事</h1>
          <button 
            onClick={() => router.push('/')}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            ← ホームに戻る
          </button>
        </div>
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
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-green-800">{chore.title}</h3>
                  <div className="flex gap-2">
                    {PREDEFINED_THANK_YOU_MESSAGES.map((msg, index) => (
                      <button
                        key={index}
                        onClick={() => handleSendThankYou(chore, msg)}
                        disabled={isSending}
                        className="px-3 py-1 text-sm bg-pink-100 text-pink-700 rounded-full hover:bg-pink-200 disabled:opacity-50"
                      >
                        {msg}
                      </button>
                    ))}
                  </div>
                </div>
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
  )
}