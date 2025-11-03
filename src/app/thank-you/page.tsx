'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import ThankYouMessage from '@/features/thank-you/components/ThankYouMessage'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { PartnerService } from '@/features/partners/services/partnerService'

/**
 * 感謝メッセージ送信ページのコンテンツコンポーネント
 */
function ThankYouPageContent() {
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()
  const router = useRouter()
  const choreId = searchParams.get('choreId')
  const [toUserId, setToUserId] = useState<string | null>(null)
  const [toUserName, setToUserName] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
    }
  }, [user, loading, router])

  // パートナーIDを解決（なければ自分自身を宛先に）
  useEffect(() => {
    const resolvePartner = async () => {
      if (!user) return
      try {
        const partner = await PartnerService.getPartnerInfo(user.id)
        if (partner) {
          setToUserId(partner.id)
          setToUserName(partner.display_name || undefined)
        } else {
          setToUserId(user.id)
          setToUserName(user.email || undefined)
        }
      } catch (e) {
        console.warn('パートナー解決に失敗。自分宛てに送信します。', e)
        setToUserId(user.id)
        setToUserName(user.email || undefined)
      }
    }
    resolvePartner()
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (!choreId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">エラー</h1>
          <p className="text-gray-600 mb-6">家事IDが指定されていません。</p>
          <button
            onClick={() => router.push('/app')}
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8" data-testid="thank-you-container">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          ありがとうメッセージ
        </h1>
        {toUserId ? (
          <ThankYouMessage choreId={choreId} toUserId={toUserId} toUserName={toUserName} />
        ) : (
          <div className="text-center text-gray-600">宛先を読み込み中...</div>
        )}
      </div>
    </div>
  )
}

/**
 * 感謝メッセージ送信ページ
 * 
 * @description 家事完了後に感謝メッセージを送信するためのページ
 * @route /thank-you?choreId={id}
 */
export default function ThankYouPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <ThankYouPageContent />
    </Suspense>
  )
}
