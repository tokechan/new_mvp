'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import ThankYouMessage from '@/components/ThankYouMessage'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * 感謝メッセージ送信ページのコンテンツコンポーネント
 */
function ThankYouPageContent() {
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()
  const router = useRouter()
  const choreId = searchParams.get('choreId')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
        <ThankYouMessage choreId={choreId} toUserId="" />
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ThankYouPageContent />
    </Suspense>
  )
}