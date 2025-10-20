'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Home, CheckSquare, Share2, Menu, X, LogOut } from 'lucide-react'
import NotificationCenter from '@/components/NotificationCenter'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'

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

  return (
    <nav 
      className="bg-white border-b border-gray-200 shadow-sm"
      role="navigation"
      aria-label="メインナビゲーション"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* ロゴ・タイトル */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-blue-600">
              ThankYou Chores
            </h1>
          </div>

          {/* ナビゲーション項目（PC表示） */}
          <div className="hidden sm:flex items-center space-x-1 sm:space-x-2">
            {/* メインナビゲーション項目 */}
            <div className="flex space-x-1 sm:space-x-2">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.path)
                return (
                  <Button
                    key={item.id}
                    variant={active ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => handleNavigation(item.path)}
                    className={`
                      flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2
                      transition-all duration-200 hover:scale-105
                      ${active 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                      }
                    `}
                    aria-label={item.description}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline text-sm font-medium">
                      {item.label}
                    </span>
                  </Button>
                )
              })}
            </div>

            {/* 通知センター */}
            <NotificationCenter />
          </div>

          {/* モバイル用: ハンバーガーと通知 */}
          <div className="flex items-center space-x-2 sm:hidden">
            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="p-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="メニューを開閉"
              aria-controls="mobile-nav-panel"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
          </div>

        {/* モバイル用メニューパネル */}
        <div className="sm:hidden relative" ref={menuRef}>
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

      {/* モバイル用の下部ナビゲーション */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="flex justify-around items-center py-2">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <button
                key={`mobile-${item.id}`}
                onClick={() => handleNavigation(item.path)}
                className={`
                  flex flex-col items-center space-y-1 px-3 py-2 rounded-lg
                  transition-all duration-200
                  ${active 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-500 hover:text-blue-600'
                  }
                `}
                aria-label={item.description}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">
                  {item.label}
                </span>
              </button>
            )
          })}
          {/* モバイル用通知センター */}
          <div className="flex flex-col items-center space-y-1 px-3 py-2">
            <NotificationCenter />
          </div>
        </div>
      </div>
    </nav>
  )
}