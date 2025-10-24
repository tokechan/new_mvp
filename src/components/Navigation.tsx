'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Home, CheckSquare, Share2, Menu, X, LogOut } from 'lucide-react'
import NotificationCenter from '@/components/NotificationCenter'
import UserMenu from '@/components/UserMenu'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import FooterChoreInput from './FooterChoreInput'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * ナビゲーションコンポーネント
 * アプリケーション全体で使用されるメインナビゲーション
 */
export default function Navigation() {
  const router = useRouter()
  const pathname = usePathname()
  const { signOut } = useAuth()

  // ナビゲーション項目の定義
  const navigationItems = [
    {
      id: 'home',
      label: 'Home',
      path: '/',
      icon: Home,
      description: 'ホーム - 家事管理'
    },
    {
      id: 'done-list',
      label: 'DoneList',
      path: '/completed-chores',
      icon: CheckSquare,
      description: '完了した家事一覧'
    },
    {
      id: 'share',
      label: 'Share',
      path: '/share',
      icon: Share2,
      description: 'パートナー招待・共有'
    }
  ]

  /**
   * ナビゲーション項目がアクティブかどうかを判定
   */
  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(path)
  }

  /**
   * ナビゲーション項目クリック時の処理
   */
  const handleNavigation = (path: string) => {
    router.push(path)
  }

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // ルート変更時はメニューを閉じる
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  // メニュー外クリックで閉じる
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    if (isMenuOpen) document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [isMenuOpen])

  // メニュー開閉に合わせてグローバルクラスを付与・解除
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      if (isMenuOpen) root.classList.add('menu-open')
      else root.classList.remove('menu-open')
    }
    return () => {
      try {
        document.documentElement.classList.remove('menu-open')
      } catch {}
    }
  }, [isMenuOpen])

  return (
    <nav 
      className="bg-gray-50"
      role="navigation"
      aria-label="メインナビゲーション"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー行：左にロゴ（PC）、中央にロゴ（モバイル）、右にナビ（PC） */}
        <div className="relative flex items-center h-16">
          {/* 左側：ハンバーガー（全サイズ） + PCロゴ */}
          <div className="flex items-center gap-3">
            {/* ハンバーガーメニュー（全サイズで表示） */}
            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="p-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="メニューを開閉"
              aria-controls="mobile-nav-panel"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            {/* PC表示用ロゴ（左寄せ） */}
            <h1 className="hidden sm:block text-xl font-bold text-blue-600 select-none">
              ThankYou Chores
            </h1>
          </div>

          {/* 中央：モバイル用ロゴ（PCでは非表示） */}
          <div className="absolute left-1/2 -translate-x-1/2 sm:hidden">
            <h1 className="text-xl font-bold text-blue-600 select-none">
              ThankYou Chores
            </h1>
          </div>

          {/* 右側ナビゲーション（PC）は削除済み：ハンバーガーに統一 */}
          <div className="ml-auto flex items-center gap-3">
            <NotificationCenter />
            <UserMenu />
          </div>
        </div>

        {/* メニューパネル（全サイズ） */}
        <div className="relative" ref={menuRef}>
          <div
            id="mobile-nav-panel"
            className={`absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden transform origin-top transition-all duration-200 ${
              isMenuOpen ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0 pointer-events-none'
            }`}
          >
            <div className="flex flex-col py-2">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.path)
                return (
                  <button
                    key={`mobile-panel-${item.id}`}
                    onClick={() => handleNavigation(item.path)}
                    className={`flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      active ? 'text-blue-700 bg-blue-50' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    aria-label={item.description}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                )
              })}

              {/* 区切り線 */}
              <div className="border-t border-gray-200 my-1" />
              {/* ログアウト */}
              <button
                key={`mobile-panel-logout`}
                onClick={async () => {
                  try {
                    await signOut()
                    router.push('/auth/signin')
                  } catch (error) {
                    console.error('ログアウトに失敗しました:', error)
                  }
                }}
                className={`flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50`}
                aria-label="ログアウト"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">ログアウト</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* フッター入力（PCにも適用、画面左右いっぱい） */}
      <FooterChoreInput />
    </nav>
  )
}