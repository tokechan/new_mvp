'use client'

import { Skeleton } from '@/shared/ui/skeleton'
import PartnerInvitation from './PartnerInvitation'

interface PartnerSetupProps {
  hasPartner: boolean | null
  onPartnerLinked: () => Promise<void>
}

/**
 * パートナー設定コンポーネント
 * 単一責務：パートナー招待・設定のUIのみを担当
 */
export function PartnerSetup({ hasPartner, onPartnerLinked }: PartnerSetupProps) {
  // ローディング中
  if (hasPartner === null) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  // パートナー未設定の場合
  if (!hasPartner) {
    return (
      <div className="text-center py-8 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          パートナーを招待しましょう
        </h2>
        <p className="text-gray-600 dark:text-zinc-300 mb-6">
          家事を一緒に管理するパートナーを招待してください
        </p>
        <PartnerInvitation onPartnerLinked={onPartnerLinked} />
      </div>
    )
  }

  return null
}