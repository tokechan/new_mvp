'use client'

// パートナー招待コンポーネント
// 作成日: 2025-09-07

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { 
  createInvitation,
  getInvitations,
  generateQRCodeUrl,
  getInvitationStatusText,
  getInvitationStatusColor,
  getTimeUntilExpiration,
  getErrorMessage
} from '@/lib/invitation-api'
import type { 
  CreateInvitationResponse,
  GetInvitationsResponse,
  PartnerInvitation
} from '@/lib/types/partner-invitation'

interface PartnerInvitationProps {
  onPartnerLinked?: () => void // パートナー連携完了時のコールバック
}

export default function PartnerInvitation({ onPartnerLinked }: PartnerInvitationProps) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invitations, setInvitations] = useState<any[]>([])
  const [currentInvitation, setCurrentInvitation] = useState<any | null>(null)
  const [showQR, setShowQR] = useState(false)
  const [inviteeEmail, setInviteeEmail] = useState('')

  // 招待一覧を取得
  const fetchInvitations = async () => {
    if (!user) return
    
    try {
      setIsLoading(true)
      const invitations: PartnerInvitation[] = await getInvitations()
      
      if (invitations && invitations.length > 0) {
        setInvitations(invitations)
        // 有効な招待があるかチェック
        const activeInvitation = invitations.find(
          inv => inv.status === 'pending' && new Date(inv.expires_at) > new Date()
        )
        setCurrentInvitation(activeInvitation || null)
      } else {
        setError('招待一覧の取得に失敗しました')
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  // 招待リンク生成
  const handleCreateInvitation = async () => {
    if (!user) return
    
    try {
      setIsLoading(true)
      setError(null)
      
      const response: CreateInvitationResponse = await createInvitation({
        invitee_email: inviteeEmail || undefined
      })
      
      if (response.success && response.data) {
        // 招待一覧を再取得
        await fetchInvitations()
        setInviteeEmail('') // フォームをクリア
      } else {
        setError(response.error || '招待の作成に失敗しました')
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  // 招待URLをクリップボードにコピー
  const handleCopyInviteUrl = async (inviteUrl: string) => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      // 成功フィードバック（簡易版）
      const button = document.activeElement as HTMLButtonElement
      if (button) {
        const originalText = button.textContent
        button.textContent = 'コピー済み！'
        setTimeout(() => {
          button.textContent = originalText
        }, 2000)
      }
    } catch (err) {
      console.error('クリップボードへのコピーに失敗:', err)
      setError('クリップボードへのコピーに失敗しました')
    }
  }

  // 初期データ取得
  useEffect(() => {
    fetchInvitations()
  }, [user])

  if (!user) {
    return null
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 dark:bg-zinc-900 dark:border-zinc-700">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-zinc-100">
        🤝 パートナーを招待
      </h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm dark:bg-red-950/30 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      {/* 有効な招待がある場合 */}
      {currentInvitation ? (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950/30 dark:border-blue-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-800 dark:text-blue-400">
                招待中
              </span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                getInvitationStatusColor(currentInvitation.status)
              }`}>
                {getInvitationStatusText(currentInvitation.status)}
              </span>
            </div>
            
            <div className="text-sm text-blue-700 dark:text-blue-300 mb-3">
              {currentInvitation.invitee_email && (
                <div>招待先: {currentInvitation.invitee_email}</div>
              )}
              <div>
                有効期限: {(() => {
                  const timeLeft = getTimeUntilExpiration(currentInvitation.expires_at)
                  if (timeLeft.expired) return '期限切れ'
                  if (timeLeft.days > 0) return `${timeLeft.days}日後`
                  if (timeLeft.hours > 0) return `${timeLeft.hours}時間後`
                  return `${timeLeft.minutes}分後`
                })()}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={() => handleCopyInviteUrl(`${window.location.origin}/invite/${currentInvitation.invite_code}`)}
                  className="px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                >
                  招待URLをコピー
                </button>
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="px-3 py-2 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
                >
                  {showQR ? 'QRコードを隠す' : 'QRコードを表示'}
                </button>
              </div>
              
              {showQR && (
                <div className="mt-3 text-center">
                  <img
                    src={generateQRCodeUrl(`${window.location.origin}/invite/${currentInvitation.invite_code}`)}
                    alt="招待QRコード"
                    className="mx-auto border border-gray-200 rounded"
                    width={200}
                    height={200}
                  />
                  <p className="text-xs text-gray-600 mt-2 dark:text-zinc-400">
                    QRコードをスキャンして招待を受け取れます
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* 新しい招待を作成 */
        <div className="space-y-4">
          <div>
            <label htmlFor="invitee-email" className="block text-sm font-medium text-gray-700 mb-2 dark:text-zinc-300">
              パートナーのメールアドレス（任意）
            </label>
            <input
              id="invitee-email"
              type="email"
              value={inviteeEmail}
              onChange={(e) => setInviteeEmail(e.target.value)}
              placeholder="partner@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1 dark:text-zinc-400">
              メールアドレスは記録用です。招待リンクは誰でも使用できます。
            </p>
          </div>
          
          <button
            onClick={handleCreateInvitation}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '招待リンクを生成中...' : '招待リンクを生成'}
          </button>
        </div>
      )}

      {/* 招待履歴 */}
      {invitations.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3 dark:text-zinc-300">
            招待履歴
          </h4>
          <div className="space-y-2">
            {invitations.slice(0, 3).map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg dark:bg-zinc-800"
              >
                <div className="flex-1">
                  <div className="text-sm text-gray-900 dark:text-zinc-100">
                    {invitation.invitee_email || '招待コード: ' + invitation.invite_code.slice(0, 8) + '...'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-zinc-400">
                    {new Date(invitation.created_at).toLocaleDateString('ja-JP')}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  getInvitationStatusColor(invitation.status)
                }`}>
                  {getInvitationStatusText(invitation.status)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}