'use client'

// ランディングページ - パートナー招待機能
// 作成日: 2025-01-27

import { useRouter } from 'next/navigation'
import { ArrowRight, HeartHandshake, Handshake, CheckCircle2, ListCheck } from 'lucide-react'

/**
 * ランディングページ - パートナー招待
 * 既存のPartnerInvitationコンポーネントを使用してLP用ページを構築
 */
export default function LandingPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-card dark:bg-background">
      {/* ヒーローセクション */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1 text-sm font-semibold uppercase tracking-wide text-primary mb-12">
              <span className="inline-block h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
              Beta版
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground dark:text-foreground mb-12">
              <span className="block">家事を</span>
              <span className="block text-primary dark:text-primary">一緒に楽しもう</span>
              {/* <span className="block">って思いませんか？</span> */}
              {/* <span className="block">いやそうだよ</span> */}
            </h1>
            <p className="text-xl text-muted-foreground dark:text-muted-foreground mb-8 max-w-3xl mx-auto">
              パートナーと一緒に家事を共有して
              <br className="hidden sm:block" mb-4 />
              もっと効率的で楽しい毎日を
              <br className="hidden sm:block" mb-4 />
              招待リンクやQRコードで簡単に始められます            
            </p>
            <div className="mx-auto mt-6 max-w-2xl rounded-xl border border-border/60 bg-background/80 px-6 py-4 text-sm text-muted-foreground shadow-sm backdrop-blur">
              <h2 className="mb-1 text-base font-semibold text-foreground">今はBETA版です</h2>
              <p>
                機能は随時更新中で、データが予告なく変更される場合があります。
                <br className="hidden sm:block" />
                気づいた点やご意見はフィードバックフォームまでお寄せください。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 特徴セクション */}
      <section className="py-16 bg-card dark:bg-card rounded-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground dark:text-foreground mb-4">
              Let&apos;s do it !!
            </h2>
            <p className="text-lg text-muted-foreground dark:text-muted-foreground">
              まずはやる事をリストアップしてみましょう
            </p>
          </div>
          <div className="mx-auto mb-12 max-w-2xl rounded-xl border border-border/60 bg-background/70 px-6 py-5 text-left shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-2">β版で提供している主な内容</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
                家事リスト作成、感謝メッセージ、パートナー招待などのコア機能
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
                PWA・プッシュ通知の初期実装（今後チューニング予定）
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
                β版のフィードバック受付（アプリ内設定から送信できます）
              </li>
            </ul>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
              <div className="w-16 h-16 bg-accent/20 dark:bg-accent/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <ListCheck className="w-8 h-8 text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold text-foreground dark:text-foreground mb-2">
                Make it !!
              </h3>
              <p className="text-muted-foreground dark:text-muted-foreground">
                やる事をリストアップしてみましょう
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent/20 dark:bg-accent/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <HeartHandshake className="w-8 h-8 text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold text-foreground dark:text-foreground mb-2">
                Share it !!
              </h3>
              <p className="text-muted-foreground dark:text-muted-foreground">
                パートナーと家事を共有して、可視化しましょう
              </p>
            </div>
            
            <div className="text-center">
            <div className="w-16 h-16 bg-accent/20 dark:bg-accent/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Handshake className="w-8 h-8 text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold text-foreground dark:text-foreground mb-2">
                Thanks it !!
              </h3>
              <p className="text-muted-foreground dark:text-muted-foreground">
                パートナーが完了した家事に”ありがとう”を送って、お互いを労い合えます
              </p>
            </div>
            
            
          </div>
        </div>
      </section>

      {/* パートナー招待セクション */}
      <section className="py-16 bg-card dark:bg-card border-t rounded-lg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground dark:text-foreground mb-4">
              今すぐパートナーを招待
            </h2>
            <p className="text-lg text-muted-foreground dark:text-muted-foreground">
              招待リンクやQRコードを使って、簡単にパートナーと連携できます
            </p>
          </div>
        </div>
      </section>

      {/* CTAセクション */}
      <section className="py-16 bg-primary dark:bg-primary rounded-lg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            今すぐ試してみよう！
          </h2>

          <p className="mx-auto mb-6 max-w-xl text-base text-primary-foreground/80">
            現在はβ版として提供しています。今後、機能の追加や仕様変更が行われる可能性がありますのでご了承ください。
          </p>

          <button
            onClick={() => router.push('/app')}
            className="inline-flex items-center px-8 py-3 bg-card text-primary font-semibold rounded-lg hover:bg-muted transition-colors"
          >
            YOUDO β を試す
            <ArrowRight className="ml-2 w-5 h-5" aria-hidden="true" />
          </button>
          <p className="mt-3 text-sm text-primary-foreground/70">
            β期間中は利用無料です。気づいたことはお気軽にフィードバックをお寄せください。
          </p>
        </div>
      </section>
    </div>
  )
}
