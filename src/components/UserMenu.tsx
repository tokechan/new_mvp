'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toast'
import { LogOut, Settings, UserRound } from 'lucide-react'

/**
 * ユーザーメニュー（アバター + ドロップダウン）
 * - 右上に表示されるアバターアイコン
 * - クリック/タップでポップアップメニュー表示
 * - メニュー項目：プロフィール編集 / 設定 / ログアウト
 */
export default function UserMenu() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const { showToast } = useToast()

  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement | null>(null)

  // 外側クリックで閉じる
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [open])

  const avatarUrl = (user as any)?.user_metadata?.avatar_url || (user as any)?.user_metadata?.picture || ''
  const displayName = (user as any)?.user_metadata?.full_name || (user as any)?.user_metadata?.name || (user as any)?.email || 'ゲスト'
  const email = (user as any)?.email || ''

  const handleProfileEdit = () => {
    setOpen(false)
    router.push('/profile/edit')
  }
  const handleSettings = () => {
    setOpen(false)
    router.push('/settings')
  }
  const handleLogout = async () => {
    try {
      await signOut()
      showToast({ message: 'ログアウトしました', variant: 'success' })
      router.push('/auth/signin')
    } catch (e) {
      console.error(e)
      showToast({ message: 'ログアウトに失敗しました', variant: 'error' })
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="ユーザーメニュー"
        className="flex items-center justify-center w-9 h-9 rounded-full border border-gray-200 bg-white hover:bg-gray-50 shadow-sm overflow-hidden"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="アバター" className="w-full h-full object-cover" />
        ) : (
          <UserRound className="w-5 h-5 text-gray-700" />
        )}
      </button>

      {/* ポップアップメニュー */}
      {open && (
        <div
          role="menu"
          aria-label="ユーザーメニューポップアップ"
          className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-[1200]"
        >
          {/* ヘッダー */}
          <div className="flex items-center gap-3 p-3 border-b border-gray-100">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="アバター" className="w-full h-full object-cover" />
              ) : (
                <UserRound className="w-5 h-5 m-2 text-gray-700" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">{displayName}</div>
              {email && <div className="text-xs text-gray-500 truncate">{email}</div>}
            </div>
          </div>

          {/* 項目 */}
          <div className="py-2">
            <button
              role="menuitem"
              onClick={handleProfileEdit}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <UserRound className="w-4 h-4" />
              プロフィール編集
            </button>
            <button
              role="menuitem"
              onClick={handleSettings}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Settings className="w-4 h-4" />
              設定
            </button>
            <div className="border-t border-gray-100 my-1" />
            <button
              role="menuitem"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <LogOut className="w-4 h-4" />
              ログアウト
            </button>
          </div>
        </div>
      )}
    </div>
  )
}