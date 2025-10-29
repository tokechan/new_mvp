'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toast'
import { LogOut, Settings, UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  const isAuthenticated = Boolean(user)

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
        className="flex items-center justify-center w-9 h-9 rounded-full border border-border bg-card hover:bg-secondary shadow-sm overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="アバター" className="w-full h-full object-cover" />
        ) : (
          <UserRound className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {/* ポップアップメニュー */}
      {open && (
        <div
          role="menu"
          aria-label="ユーザーメニューポップアップ"
          className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-xl z-[1200]"
        >
          {/* ヘッダー */}
          <div className="flex items-center gap-3 p-3 border-b border-border">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-border">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="アバター" className="w-full h-full object-cover" />
              ) : (
                <UserRound className="w-5 h-5 m-2 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground truncate">{displayName}</div>
              {email && <div className="text-xs text-muted-foreground truncate">{email}</div>}
            </div>
          </div>

          {/* 項目 */}
          <div className="py-2">
            <button
              role="menuitem"
              onClick={handleProfileEdit}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-secondary"
            >
              <UserRound className="w-4 h-4 text-muted-foreground" />
              プロフィール編集
            </button>
            <button
              role="menuitem"
              onClick={handleSettings}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-secondary"
            >
              <Settings className="w-4 h-4 text-muted-foreground" />
              設定
            </button>
            <div className="border-t border-border my-1" />
            <button
              role="menuitem"
              onClick={handleLogout}
              disabled={!isAuthenticated}
              aria-disabled={!isAuthenticated}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                isAuthenticated
                  ? 'text-foreground hover:bg-secondary'
                  : 'pointer-events-none cursor-default text-muted-foreground/70 hover:bg-transparent opacity-60'
              )}
            >
              <LogOut
                className={cn(
                  'w-4 h-4',
                  isAuthenticated ? 'text-destructive' : 'text-muted-foreground/70'
                )}
              />
              ログアウト
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
