'use client'

// 機能紹介ページ
// 作成日: 2025-10-31

import { useRouter } from 'next/navigation'
import PartnerInvitation from '@/features/partners/components/PartnerInvitation'
import { ArrowRight } from 'lucide-react'

/**
 * 機能紹介ページ
 * まだ作成中
 */
export default function LandingPage() {
  const router = useRouter()

  /**
   * パートナー連携完了時の処理
   */
  const handlePartnerLinked = () => {
    // ホームページに戻る
    router.push('/app')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary to-primary/10 dark:from-background dark:to-secondary">
      {/* ヒーローセクション */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground dark:text-foreground mb-6">
              準備中です
            </h1>
          </div>
        </div>
      </section>

      {/* 特徴セクション */}
      <section className="py-16 bg-card dark:bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground dark:text-foreground mb-4">
              準備中です
            </h2>
            <p className="text-lg text-muted-foreground dark:text-muted-foreground">
              準備中です。
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-accent/20 dark:bg-accent/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💝</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground dark:text-foreground mb-2">
                準備中です
              </h3>
              <p className="text-muted-foreground dark:text-muted-foreground">
                準備中です。
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 dark:bg-primary/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤝</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground dark:text-foreground mb-2">
                準備中です
              </h3>
              <p className="text-muted-foreground dark:text-muted-foreground">
                準備中です。
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 dark:bg-primary/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground dark:text-foreground mb-2">
                準備中です
              </h3>
              <p className="text-muted-foreground dark:text-muted-foreground">
                準備中です。
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* CTAセクション */}
      <section className="py-16 bg-primary dark:bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            準備中です
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8">
            準備中です。
          </p>
          <button
            onClick={() => router.push('/app')}
            className="inline-flex items-center px-8 py-3 bg-card text-primary font-semibold rounded-lg hover:bg-muted transition-colors"
          >
            ホームに戻る
            <ArrowRight className="ml-2 w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </section>
    </div>
  )
}
