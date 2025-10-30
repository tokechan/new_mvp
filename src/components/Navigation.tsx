'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Home, CheckSquare, Share2, Menu, X, LogOut } from 'lucide-react'
import NotificationCenter from '@/components/NotificationCenter'
import UserMenu from '@/components/UserMenu'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { YOUDOLogo } from '@/components/YOUDOLogo'

/**
 * ナビゲーションコンポーネント
 * アプリケーション全体で使用されるメインナビゲーション
 */
export default function Navigation() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const isAuthenticated = Boolean(user)

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
    if (!isAuthenticated) {
      return
    }
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
      className="bg-card border-b border-gray-200 sm:shadow-sm"
      role="navigation"
      aria-label="メインナビゲーション"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー行：左にハンバーガー + ロゴ、中央にロゴ（モバイル）、右にアイコン */}
        <div className="relative flex items-center h-16">
          {/* 左側：ハンバーガー + ロゴ */}
          <div className="flex items-center gap-3 mr-3">
            {/* ハンバーガーメニュー（全サイズで表示） */}
            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="p-2 rounded-lg text-gray-700 hover:text-primary hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/40"
              aria-label="メニューを開閉"
              aria-controls="nav-panel"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* ロゴ：ハンバーガーメニューの右側（常時表示） */}
          <div className="select-none">
            <YOUDOLogo width={100} height={36} />
          </div>

          {/* 右側：通知センター + ユーザーメニュー */}
          <div className="ml-auto flex items-center gap-2">
            {/* 通知センター */}
            <div className="hide-on-menu-open">
              <NotificationCenter />
            </div>

            {/* ユーザーメニュー（アバター） */}
            <UserMenu />
          </div>
        </div>

        {/* メニューパネル（全サイズ） */}
        <div className="relative" ref={menuRef}>
          <div
            id="nav-panel"
            className={`absolute left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg overflow-hidden transform origin-top transition-all duration-200 z-[1001] ${
              isMenuOpen ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0 pointer-events-none'
            }`}
          >
            <div className="flex flex-col py-2">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.path)
                return (
                  <button
                    key={`nav-panel-${item.id}`}
                    onClick={() => handleNavigation(item.path)}
                    disabled={!isAuthenticated}
                    aria-disabled={!isAuthenticated}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 text-left transition-colors',
                      isAuthenticated
                        ? active
                          ? 'text-primary bg-secondary'
                          : 'text-foreground hover:bg-secondary'
                        : 'pointer-events-none cursor-default text-muted-foreground/70 hover:bg-transparent opacity-60'
                    )}
                    aria-label={item.description}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                )
              })}

              {/* 区切り線 */}
              <div className="border-t border-border my-1" />
              {/* ログアウト */}
              <button
                key={`nav-panel-logout`}
                onClick={async () => {
                  if (!isAuthenticated) return
                  try {
                    await signOut()
                    router.push('/auth/signin')
                  } catch (error) {
                    console.error('ログアウトに失敗しました:', error)
                  }
                }}
                disabled={!isAuthenticated}
                aria-disabled={!isAuthenticated}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 text-left transition-colors',
                  isAuthenticated
                    ? 'text-foreground hover:bg-secondary'
                    : 'pointer-events-none cursor-default text-muted-foreground/70 hover:bg-transparent opacity-60'
                )}
                aria-label="ログアウト"
              >
                <LogOut
                  className={cn(
                    'w-5 h-5',
                    isAuthenticated ? 'text-destructive' : 'text-muted-foreground/70'
                  )}
                />
                <span className="text-sm font-medium">ログアウト</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
