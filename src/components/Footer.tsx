"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Footer() {
  const pathname = usePathname()
  const isOnboardingPage = pathname?.startsWith('/onboarding')
  const isDevToolsPage = pathname?.startsWith('/dev-tools')
  
  // オンボーディングページとDevToolsページでは非表示
  if (isOnboardingPage || isDevToolsPage) {
    return null
  }

  return (
    <footer className="mt-12 border-t border-border bg-card/30">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <nav className="flex flex-wrap items-center gap-4">
          <Link href="/legal/terms" className="transition-colors hover:text-primary">
            利用規約
          </Link>
          <Link href="/legal/privacy" className="transition-colors hover:text-primary">
            プライバシーポリシー
          </Link>
          {/* TODO: 本番リリース時に /legal/law を有効化
          <Link href="/legal/law" className="transition-colors hover:text-primary">
            特定商取引法に基づく表記
          </Link>
          */}
        </nav>
        <p className="text-xs sm:text-sm">© {new Date().getFullYear()} YOUDO. All rights reserved.</p>
      </div>
    </footer>
  )
}
