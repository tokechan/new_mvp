'use client'

import Image from 'next/image'
import {
  generateQRCodeUrl,
  getInvitationStatusText,
  getInvitationStatusColor,
  getTimeUntilExpiration,
} from '@/lib/invitation-api'
import type { PartnerInvitation } from '@/features/partners/types/invitation'

interface PartnerInvitationActiveCardProps {
  invitation: PartnerInvitation
  inviteUrl: string
  showQR: boolean
  onToggleQR: () => void
  onCopyInviteUrl: (inviteUrl: string) => Promise<void>
}

export function PartnerInvitationActiveCard({
  invitation,
  inviteUrl,
  showQR,
  onToggleQR,
  onCopyInviteUrl,
}: PartnerInvitationActiveCardProps) {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-info/10 border border-info/30 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-info">招待中</span>
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${getInvitationStatusColor(invitation.status)}`}
          >
            {getInvitationStatusText(invitation.status)}
          </span>
        </div>

        <div className="text-sm text-info mb-3 space-y-1">
          {invitation.invitee_email && <div>招待先: {invitation.invitee_email}</div>}
          <div>
            有効期限: {
              (() => {
                const timeLeft = getTimeUntilExpiration(invitation.expires_at)
                if (timeLeft.expired) return '期限切れ'
                if (timeLeft.days > 0) return `${timeLeft.days}日後`
                if (timeLeft.hours > 0) return `${timeLeft.hours}時間後`
                return `${timeLeft.minutes}分後`
              })()
            }
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => onCopyInviteUrl(inviteUrl)}
              className="px-3 py-2 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
            >
              招待URLをコピー
            </button>
            <button
              onClick={onToggleQR}
              className="px-3 py-2 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
            >
              {showQR ? 'QRコードを隠す' : 'QRコードを表示'}
            </button>
          </div>

          {showQR && (
            <div className="mt-3 text-center">
              <Image
                src={generateQRCodeUrl(inviteUrl)}
                alt="招待QRコード"
                className="mx-auto border border-border rounded"
                width={200}
                height={200}
              />
              <p className="text-xs text-muted-foreground mt-2">QRコードをスキャンして招待を受け取れます</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
