'use client'

import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">利用規約</h1>
          <p className="text-sm text-muted-foreground">
            本アプリの利用条件を定める規約です。正式版が整い次第、ここに最新の内容を掲載します。
          </p>
        </header>

        <section className="space-y-3 text-sm leading-relaxed text-foreground">
          <p>現在、利用規約の正式な文面を準備中です。準備ができ次第、最新の情報を記載します。</p>
          <p>
            ドラフト版は{' '}
            <Link href="/docs/reference/terms.md" className="text-primary underline underline-offset-4">
              ドキュメント
            </Link>
            をご確認ください。
          </p>
        </section>

        <footer className="text-xs text-muted-foreground">
          最終更新日: {new Date().toLocaleDateString('ja-JP')}
        </footer>
      </div>
    </div>
  )
}
