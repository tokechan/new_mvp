'use client'

// パートナー招待コンポーネント
// 作成日: 2025-09-07

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
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
} from '@/types/invitation'

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
  const fetchInvitations = useCallback(async () => {
    if (!user) return
    
    try {
      setIsLoading(true)
      const response: GetInvitationsResponse = await getInvitations()
      const invitations = response.success ? response.invitations || [] : []
      
      setInvitations(invitations || [])
      // 有効な招待があるかチェック
      const activeInvitation = invitations?.find(
        (inv: PartnerInvitation) => inv.status === 'pending' && new Date(inv.expires_at) > new Date()
      )
      setCurrentInvitation(activeInvitation || null)
      setError(null) // 成功時はエラーをクリア
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // 招待リンク生成
  const handleCreateInvitation = async () => {
    if (!user) return
    
    try {
      setIsLoading(true)
      setError(null)
      
      const response: CreateInvitationResponse = await createInvitation({
        invitee_email: inviteeEmail || undefined
      })
      
      if (response.success && response.invitation) {
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
  }, [user, fetchInvitations])

  if (!user) {
    return null
  }

  return (
    <div className="bg-card rounded-lg p-6">
      
      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
          {error}
        </div>
      )}

      {/* 有効な招待がある場合 */}
      {currentInvitation ? (
        <div className="space-y-4">
          <div className="p-4 bg-info/10 border border-info/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-info">
                招待中
              </span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                getInvitationStatusColor(currentInvitation.status)
              }`}>
                {getInvitationStatusText(currentInvitation.status)}
              </span>
            </div>
            
            <div className="text-sm text-info mb-3">
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
                  className="px-3 py-2 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
                >
                  招待URLをコピー
                </button>
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="px-3 py-2 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
                >
                  {showQR ? 'QRコードを隠す' : 'QRコードを表示'}
                </button>
              </div>
              
              {showQR && (
                <div className="mt-3 text-center">
                  <Image
                    src={generateQRCodeUrl(`${window.location.origin}/invite/${currentInvitation.invite_code}`)}
                    alt="招待QRコード"
                    className="mx-auto border border-border rounded"
                    width={200}
                    height={200}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
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
            <label htmlFor="invitee-email" className="block text-sm font-medium text-muted-foreground mb-2">
              パートナーのメールアドレス（任意）
            </label>
            <input
              id="invitee-email"
              type="email"
              value={inviteeEmail}
              onChange={(e) => setInviteeEmail(e.target.value)}
              placeholder="partner@example.com"
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground mt-1">
              メールアドレスは記録用です。招待リンクは誰でも使用できます。
            </p>
          </div>
          
          <button
            onClick={handleCreateInvitation}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            {isLoading ? '招待リンクを生成中...' : '招待リンクを生成'}
          </button>
        </div>
      )}

      {/* 招待履歴 */}
      {invitations.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            招待履歴
          </h4>
          <div className="space-y-2">
            {invitations.slice(0, 3).map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex-1">
                  <div className="text-sm text-foreground">
                    {invitation.invitee_email || '招待コード: ' + invitation.invite_code.slice(0, 8) + '...'}
                  </div>
                  <div className="text-xs text-muted-foreground">
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