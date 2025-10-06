'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Home, CheckSquare, Share2 } from 'lucide-react'
import NotificationCenter from '@/components/NotificationCenter'

/**
 * ナビゲーションコンポーネント
 * アプリケーション全体で使用されるメインナビゲーション
 */
export default function Navigation() {
  const router = useRouter()
  const pathname = usePathname()

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

          {/* ナビゲーション項目 */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* メインナビゲーション項目 */}
            <div className="flex space-x-1 sm:space-x-2">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.path)
                
                return (
                  <Button
                    key={item.id}
                    variant={active ? "default" : "ghost"}
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