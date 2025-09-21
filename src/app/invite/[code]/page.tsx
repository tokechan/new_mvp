'use client'

// 招待受諾ページ
// 作成日: 2025-09-07

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { 
  getInvitation,
  acceptInvitation,
  validateInviteCode,
  getTimeUntilExpiration,
  getErrorMessage
} from '@/lib/invitation-api'
import type { 
  GetInvitationResponse,
  AcceptInvitationResponse 
} from '@/lib/types/partner-invitation'

interface InvitePageProps {
  params: Promise<{
    code: string
  }>
}

export default function InvitePage({ params }: InvitePageProps) {
  const [code, setCode] = useState<string>('')
  const router = useRouter()
  const { user, signIn } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isAccepting, setIsAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invitationData, setInvitationData] = useState<any | null>(null)
  const [acceptanceResult, setAcceptanceResult] = useState<any | null>(null)

  // paramsを非同期で取得
  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setCode(resolvedParams.code)
    }
    getParams()
  }, [params])

  // 招待情報を取得
  const fetchInvitationInfo = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // 招待コードの形式チェック
      if (!validateInviteCode(code)) {
        setError('無効な招待コードです')
        return
      }

      const response: GetInvitationResponse = await getInvitation(code)
      
      if (response.success && response.data) {
        setInvitationData(response.data)
      } else {
        setError(response.error || '招待情報の取得に失敗しました')
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [code])

  // 招待を受諾
  const handleAcceptInvitation = async () => {
    if (!user) {
      setError('招待を受諾するにはログインが必要です')
      return
    }

    try {
      setIsAccepting(true)
      setError(null)
      
      const response: AcceptInvitationResponse = await acceptInvitation(code)
      
      if (response.success && response.data) {
        setAcceptanceResult(response.data)
        // 3秒後にホームページにリダイレクト
        setTimeout(() => {
          router.push('/')
        }, 3000)
      } else {
        setError(response.error || '招待の受諾に失敗しました')
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsAccepting(false)
    }
  }

  // 初期データ取得
  useEffect(() => {
    if (code) {
      fetchInvitationInfo()
    }
  }, [code, fetchInvitationInfo])

  // ローディング中
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-zinc-400">招待情報を確認中...</p>
        </div>
      </div>
    )
  }

  // 受諾完了画面
  if (acceptanceResult) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center dark:bg-zinc-800">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4 dark:text-zinc-100">
              パートナー連携完了！
            </h1>
            <div className="space-y-3 text-gray-600 dark:text-zinc-400">
              <p>
                <span className="font-medium text-gray-900 dark:text-zinc-100">
                  {acceptanceResult.partner_name}
                </span>
                さんとの連携が完了しました
              </p>
              <p>
                共有された家事: <span className="font-bold text-blue-600">{acceptanceResult.shared_chores_count}件</span>
              </p>
              <p className="text-sm">
                これから一緒に家事を管理しましょう！
              </p>
            </div>
            <div className="mt-6">
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                家事一覧を見る
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-4 dark:text-zinc-500">
              3秒後に自動的にリダイレクトします
            </p>
          </div>
        </div>
      </div>
    )
  }

  // エラー画面
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center dark:bg-zinc-800">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4 dark:text-zinc-100">
              招待エラー
            </h1>
            <p className="text-red-600 mb-6 dark:text-red-400">
              {error}
            </p>
            <div className="space-y-3">
              <button
                onClick={fetchInvitationInfo}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                再試行
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                ホームに戻る
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 招待情報表示・受諾画面
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8 dark:bg-zinc-800">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🤝</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 dark:text-zinc-100">
              パートナー招待
            </h1>
            <p className="text-gray-600 dark:text-zinc-400">
              家事管理アプリへの招待が届いています
            </p>
          </div>

          {invitationData && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-950/30 dark:border-blue-800">
                <h3 className="font-medium text-blue-800 mb-2 dark:text-blue-400">
                  招待者情報
                </h3>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p><span className="font-medium">名前:</span> {invitationData.inviter_name}</p>
                  <p><span className="font-medium">メール:</span> {invitationData.inviter_email}</p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 dark:bg-yellow-950/30 dark:border-yellow-800">
                <h3 className="font-medium text-yellow-800 mb-2 dark:text-yellow-400">
                  有効期限
                </h3>
                <div className="text-sm text-yellow-700 dark:text-yellow-300">
                  {(() => {
                    const timeLeft = getTimeUntilExpiration(invitationData.expires_at)
                    if (timeLeft.expired) {
                      return <span className="text-red-600 dark:text-red-400">期限切れです</span>
                    }
                    if (timeLeft.days > 0) {
                      return `あと ${timeLeft.days}日 ${timeLeft.hours}時間`
                    }
                    if (timeLeft.hours > 0) {
                      return `あと ${timeLeft.hours}時間 ${timeLeft.minutes}分`
                    }
                    return `あと ${timeLeft.minutes}分`
                  })()}
                </div>
              </div>

              <div className="text-center text-sm text-gray-600 dark:text-zinc-400">
                <p>👫 一緒に家事を管理しませんか？</p>
                <p>招待を受諾すると、家事の追加・完了・削除がリアルタイムで共有されます。</p>
              </div>

              {user ? (
                <div className="space-y-3">
                  <button
                    onClick={handleAcceptInvitation}
                    disabled={isAccepting}
                    className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {isAccepting ? '招待を受諾中...' : '招待を受諾する'}
                  </button>
                  <p className="text-xs text-gray-500 text-center dark:text-zinc-500">
                    現在のアカウント: {user.email}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      // 認証ページにリダイレクト（招待コードを保持）
                      const currentUrl = window.location.href
                      window.location.href = `/auth?redirect=${encodeURIComponent(currentUrl)}`
                    }}
                    className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                  >
                    ログインして招待を受諾
                  </button>
                  <p className="text-xs text-gray-500 text-center dark:text-zinc-500">
                    招待を受諾するにはログインが必要です
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}