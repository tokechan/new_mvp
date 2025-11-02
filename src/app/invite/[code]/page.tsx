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
} from '@/types/invitation'
import { Handshake, PartyPopper } from 'lucide-react'

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
      
      if (response.success && response.invitation) {
        setInvitationData(response.invitation)
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
      
      if (response.success) {
        setAcceptanceResult(response.data ?? { success: true })
        // 3秒後にホームページにリダイレクト
        setTimeout(() => {
          router.push('/app')
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
      <div className="min-h-screen flex items-center justify-center bg-muted dark:bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground dark:text-muted-foreground">招待情報を確認中...</p>
        </div>
      </div>
    )
  }

  // 受諾完了画面
  if (acceptanceResult) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted dark:bg-background">
        <div className="max-w-md w-full mx-4">
          <div className="bg-card rounded-lg shadow-lg p-8 text-center dark:bg-card">
-            <div className="text-6xl mb-4">🎉</div>
+            <PartyPopper className="w-16 h-16 mx-auto mb-4 text-primary" aria-hidden="true" />
             <h1 className="text-2xl font-bold text-foreground mb-4">
               パートナー連携完了！
             </h1>
            <div className="space-y-3 text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">
                  {acceptanceResult?.partner_name ?? 'パートナー'}
                </span>
                さんとの連携が完了しました
              </p>
              <p>
                共有された家事: <span className="font-bold text-primary">{acceptanceResult?.shared_chores_count ?? 0}件</span>
              </p>
              <p className="text-sm">
                これから一緒に家事を管理しましょう！
              </p>
            </div>
            <div className="mt-6">
              <button
                onClick={() => router.push('/app')}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                家事一覧を見る
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
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
      <div className="min-h-screen flex items-center justify-center bg-muted dark:bg-background">
        <div className="max-w-md w-full mx-4">
          <div className="bg-card rounded-lg shadow-lg p-8 text-center dark:bg-card">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-foreground mb-4">
              招待エラー
            </h1>
            <p className="text-destructive mb-6">
              {error}
            </p>
            <div className="space-y-3">
              <button
                onClick={fetchInvitationInfo}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                再試行
              </button>
              <button
                onClick={() => router.push('/app')}
                className="w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
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
    <div className="min-h-screen flex items-center justify-center bg-muted dark:bg-background">
      <div className="max-w-md w-full mx-4">
        <div className="bg-card rounded-lg shadow-lg p-8 dark:bg-card">
          <div className="text-center mb-6">
-            <div className="text-6xl mb-4">🤝</div>
+            <Handshake className="w-16 h-16 mx-auto mb-4 text-primary" aria-hidden="true" />
             <h1 className="text-2xl font-bold text-foreground mb-2">
               パートナー招待
             </h1>
            <p className="text-muted-foreground">
              家事管理アプリへの招待が届いています
            </p>
          </div>

          {invitationData && (
            <div className="space-y-4">
              <div className="bg-info/10 border border-info/30 rounded-lg p-4 dark:bg-info/10 dark:border-info/40">
                <h3 className="font-medium text-info mb-2">
                  招待者情報
                </h3>
                <div className="text-sm text-info">
                  <p><span className="font-medium">名前:</span> {invitationData.inviter_name}</p>
                  <p><span className="font-medium">メール:</span> {invitationData.inviter_email}</p>
                </div>
              </div>

              <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 dark:bg-warning/10 dark:border-warning/40">
                <h3 className="font-medium text-warning mb-2">
                  有効期限
                </h3>
                <div className="text-sm text-warning">
                  {(() => {
                    const timeLeft = getTimeUntilExpiration(invitationData.expires_at)
                    if (timeLeft.expired) {
                      return <span className="text-destructive">期限切れです</span>
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

              <div className="text-center text-sm text-muted-foreground">
                <p>👫 一緒に家事を管理しませんか？</p>
                <p>招待を受諾すると、家事の追加・完了・削除がリアルタイムで共有されます。</p>
              </div>

              {user ? (
                <div className="space-y-3">
                  <button
                    onClick={handleAcceptInvitation}
                    disabled={isAccepting}
                    className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {isAccepting ? '招待を受諾中...' : '招待を受諾する'}
                  </button>
                  <p className="text-xs text-muted-foreground text-center">
                    現在のアカウント: {user.email}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      // 認証ページにリダイレクト（招待コードを保持）
                      const currentUrl = window.location.href
                      window.location.href = `/auth/signin?redirect=${encodeURIComponent(currentUrl)}`
                    }}
                    className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                  >
                    ログインして招待を受諾
                  </button>
                  <p className="text-xs text-muted-foreground text-center">
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
