'use client'

import { PartnerInfo as PartnerInfoType } from '@/features/chores/types/chore'

interface PartnerInfoProps {
  hasPartner: boolean | null
  partnerInfo: PartnerInfoType | null
  onUnlinkPartner: () => Promise<void>
}

/**
 * パートナー情報表示コンポーネント
 * ChoresList.tsxから分離されたパートナー情報UI
 */
export function PartnerInfo({ hasPartner, partnerInfo, onUnlinkPartner }: PartnerInfoProps) {
  if (hasPartner === null) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-gray-600">パートナー情報を読み込み中...</p>
      </div>
    )
  }

  if (!hasPartner) {
    return (
      <div className="bg-primary/10 p-4 rounded-lg">
        <p className="text-primary font-medium">パートナーが未設定です</p>
        <p className="text-primary text-sm mt-1">
          下の招待機能を使ってパートナーを招待してください
        </p>
      </div>
    )
  }

  return (
    <div className="bg-primary/10 p-4 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-green-800 font-medium">
            パートナー: {partnerInfo?.name || 'パートナー'}
          </p>
          <p className="text-green-600 text-sm">
            ID: {partnerInfo?.id}
          </p>
        </div>
        <button
          onClick={onUnlinkPartner}
          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
        >
          連携解除
        </button>
      </div>
    </div>
  )
}