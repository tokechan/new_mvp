'use client'

// パートナー招待コンポーネント
// 作成日: 2025-09-07

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  createInvitation,
  getInvitations,
  getInvitationStatusColor,
  getInvitationStatusText,
  getErrorMessage,
} from '@/lib/invitation-api'
import type { 
  CreateInvitationResponse,
  GetInvitationsResponse,
  PartnerInvitation
} from '@/types/invitation'
import { PartnerInvitationActiveCard } from '@/features/partners/components/PartnerInvitationActiveCard'
import { PartnerInvitationCreateForm } from '@/features/partners/components/PartnerInvitationCreateForm'

interface PartnerInvitationProps {
  onPartnerLinked?: () => void // パートナー連携完了時のコールバック
}

export default function PartnerInvitation({ onPartnerLinked }: PartnerInvitationProps) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invitations, setInvitations] = useState<PartnerInvitation[]>([])
  const [currentInvitation, setCurrentInvitation] = useState<PartnerInvitation | null>(null)
  const [showQR, setShowQR] = useState(false)
  const [inviteeEmail, setInviteeEmail] = useState('')

  const currentInviteUrl = useMemo(() => {
    if (!currentInvitation) return ''
    const baseUrl =
      typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
    return `${baseUrl}/invite/${currentInvitation.invite_code}`
  }, [currentInvitation])

  // 招待一覧を取得
  const fetchInvitations = useCallback(async () => {
    if (!user) return
    
    try {
      setIsLoading(true)
      const response: GetInvitationsResponse = await getInvitations()
      const invitationList: PartnerInvitation[] = response.success ? response.invitations ?? [] : []
      
      setInvitations(invitationList)
      // 有効な招待があるかチェック
      const activeInvitation = invitationList.find(
        (inv) => inv.status === 'pending' && new Date(inv.expires_at) > new Date()
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
        <PartnerInvitationActiveCard
          invitation={currentInvitation}
          inviteUrl={currentInviteUrl}
          showQR={showQR}
          onToggleQR={() => setShowQR((prev) => !prev)}
          onCopyInviteUrl={handleCopyInviteUrl}
        />
      ) : (
        <PartnerInvitationCreateForm
          inviteeEmail={inviteeEmail}
          onInviteeEmailChange={setInviteeEmail}
          onSubmit={handleCreateInvitation}
          isLoading={isLoading}
        />
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
