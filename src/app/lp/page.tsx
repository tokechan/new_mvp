'use client'

// ランディングページ - パートナー招待機能
// 作成日: 2025-01-27

import { useRouter } from 'next/navigation'
import PartnerInvitation from '@/components/PartnerInvitation'

/**
 * ランディングページ - パートナー招待
 * 既存のPartnerInvitationコンポーネントを使用してLP用ページを構築
 */
export default function LandingPage() {
  const router = useRouter()

  /**
   * パートナー連携完了時の処理
   */
  const handlePartnerLinked = () => {
    // ホームページに戻る
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary to-primary/10 dark:from-background dark:to-secondary">
      {/* ヒーローセクション */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground dark:text-foreground mb-6">
              <span className="block">家事を</span>
              <span className="block text-primary dark:text-primary">一緒に管理</span>
              <span className="block">しませんか？</span>
            </h1>
            <p className="text-xl text-muted-foreground dark:text-muted-foreground mb-8 max-w-3xl mx-auto">
              パートナーと家事を共有して、もっと効率的で楽しい毎日を。
              <br className="hidden sm:block" />
              招待リンクやQRコードで簡単に始められます。
            </p>
          </div>
        </div>
      </section>

      {/* 特徴セクション */}
      <section className="py-16 bg-card dark:bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground dark:text-foreground mb-4">
              なぜパートナーと一緒に？
            </h2>
            <p className="text-lg text-muted-foreground dark:text-muted-foreground">
              二人で家事を管理することで得られるメリット
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-accent/20 dark:bg-accent/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💝</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground dark:text-foreground mb-2">
                感謝を伝え合う
              </h3>
              <p className="text-muted-foreground dark:text-muted-foreground">
                完了した家事に「ありがとう」を送って、お互いを労い合えます。
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 dark:bg-primary/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤝</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground dark:text-foreground mb-2">
                協力して効率アップ
              </h3>
              <p className="text-muted-foreground dark:text-muted-foreground">
                家事の分担が明確になり、お互いの負担を軽減できます。
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-success/10 dark:bg-success/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground dark:text-foreground mb-2">
                進捗の見える化
              </h3>
              <p className="text-muted-foreground dark:text-muted-foreground">
                お互いの家事の進捗がリアルタイムで分かり、感謝の気持ちも伝えられます。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* パートナー招待セクション */}
      <section className="py-16 bg-muted dark:bg-secondary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground dark:text-foreground mb-4">
              今すぐパートナーを招待
            </h2>
            <p className="text-lg text-muted-foreground dark:text-muted-foreground">
              招待リンクやQRコードを使って、簡単にパートナーと連携できます。
            </p>
          </div>
          
          {/* パートナー招待コンポーネント */}
          <div className="max-w-2xl mx-auto">
            <PartnerInvitation onPartnerLinked={handlePartnerLinked} />
          </div>
        </div>
      </section>

      {/* CTAセクション */}
      <section className="py-16 bg-primary dark:bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            一緒に始めませんか？
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8">
            パートナーと家事を共有して、より良い毎日を築きましょう。
          </p>
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center px-8 py-3 bg-card text-primary font-semibold rounded-lg hover:bg-muted transition-colors"
          >
            ホームに戻る
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </section>
    </div>
  )
}