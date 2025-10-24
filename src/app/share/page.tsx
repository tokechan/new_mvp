'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import PartnerInvitation from '@/components/PartnerInvitation'

/**
 * パートナー招待・共有ページ
 * パートナーとの連携機能を管理するページ
 */
export default function SharePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // 認証チェック
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
    }
  }, [user, loading, router])

  // ローディング状態
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    )
  }

  // 未認証の場合
  if (!user) {
    return null
  }

  /**
   * パートナー連携完了時の処理
   */
  const handlePartnerLinked = () => {
    // ホームページに戻る
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          {/* ページヘッダー */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              パートナー招待・共有
            </h1>
            <p className="text-muted-foreground">
              パートナーを招待して、家事を一緒に管理しましょう。
              招待リンクやQRコードを使って簡単に連携できます。
            </p>
          </div>

          {/* パートナー招待コンポーネント */}
          <PartnerInvitation onPartnerLinked={handlePartnerLinked} />
        </div>
      </main>
    </div>
  )
}