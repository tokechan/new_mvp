'use client'

// ランディングページ - パートナー招待機能
// 作成日: 2025-01-27

import { useRouter } from 'next/navigation'
import PartnerInvitation from '@/components/PartnerInvitation'
import Navigation from '@/components/Navigation'

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800">
      {/* ナビゲーション */}
      <Navigation />
      
      {/* ヒーローセクション */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              <span className="block">家事を</span>
              <span className="block text-blue-600 dark:text-blue-400">一緒に管理</span>
              <span className="block">しませんか？</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-zinc-300 mb-8 max-w-3xl mx-auto">
              パートナーと家事を共有して、もっと効率的で楽しい毎日を。
              <br className="hidden sm:block" />
              招待リンクやQRコードで簡単に始められます。
            </p>
          </div>
        </div>
      </section>

      {/* 特徴セクション */}
      <section className="py-16 bg-white dark:bg-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              なぜパートナーと一緒に？
            </h2>
            <p className="text-lg text-gray-600 dark:text-zinc-300">
              二人で家事を管理することで得られるメリット
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💝</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                感謝を伝え合う
              </h3>
              <p className="text-gray-600 dark:text-zinc-300">
                完了した家事に「ありがとう」を送って、お互いを労い合えます。
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤝</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                協力して効率アップ
              </h3>
              <p className="text-gray-600 dark:text-zinc-300">
                家事の分担が明確になり、お互いの負担を軽減できます。
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                進捗の見える化
              </h3>
              <p className="text-gray-600 dark:text-zinc-300">
                お互いの家事の進捗がリアルタイムで分かり、感謝の気持ちも伝えられます。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* パートナー招待セクション */}
      <section className="py-16 bg-gray-50 dark:bg-zinc-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              今すぐパートナーを招待
            </h2>
            <p className="text-lg text-gray-600 dark:text-zinc-300">
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
      <section className="py-16 bg-blue-600 dark:bg-blue-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            一緒に始めませんか？
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            パートナーと家事を共有して、より良い毎日を築きましょう。
          </p>
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            ホームに戻る
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </section>
      
      {/* モバイル用の下部余白（ナビゲーションバーの分） */}
      <div className="h-20 sm:h-0" />
    </div>
  )
}