'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { useToast } from '@/shared/ui/toast'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { UserRound } from 'lucide-react'
import { Label } from '@/shared/ui/label'
import { profileService } from '@/services/profileService'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'

export default function ProfileEditPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const { showToast } = useToast()
  const supabase = createSupabaseBrowserClient()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [openDelete, setOpenDelete] = useState(false)

  const avatarUrl = (user as any)?.user_metadata?.avatar_url || (user as any)?.user_metadata?.picture || ''

  useEffect(() => {
    if (!user) return
    setEmail((user as any)?.email || '')

    // プロフィール名を取得（なければ作成）
    ;(async () => {
      try {
        await profileService.ensureProfile(user as any)
        const prof = await profileService.getProfile((user as any)?.id)
        const nameFromProfile = prof?.display_name || (user as any)?.user_metadata?.full_name || (user as any)?.user_metadata?.name || ''
        setDisplayName(nameFromProfile)
      } catch (e) {
        console.error(e)
      }
    })()
  }, [user])

  const handleSaveName = async () => {
    if (!user) return
    try {
      // Supabaseのユーザーメタデータ更新（表示名）
      await supabase.auth.updateUser({ data: { full_name: displayName, name: displayName } as any })
      // アプリのprofilesテーブルも更新
      await profileService.updateProfile((user as any)?.id, { display_name: displayName })
      showToast({ message: '氏名を更新しました', variant: 'success' })
    } catch (e) {
      console.error(e)
      showToast({ message: '氏名の更新に失敗しました', variant: 'error' })
    }
  }

  const handleSaveEmail = async () => {
    if (!user) return
    try {
      const { error } = await supabase.auth.updateUser({ email })
      if (error) throw error
      showToast({ message: 'メール更新手続きを送信しました（確認メール）', variant: 'info' })
    } catch (e) {
      console.error(e)
      showToast({ message: 'メール更新に失敗しました', variant: 'error' })
    }
  }

  const handleSavePassword = async () => {
    if (!user || !newPassword) return
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setNewPassword('')
      showToast({ message: 'パスワードを更新しました', variant: 'success' })
    } catch (e) {
      console.error(e)
      showToast({ message: 'パスワード更新に失敗しました', variant: 'error' })
    }
  }

  const handleDeleteAccount = async () => {
    // クライアントからの完全削除はできないため、暫定処理
    try {
      setOpenDelete(false)
      showToast({ message: '削除リクエストを受け付けました（暫定）', variant: 'warning' })
      await signOut()
      router.push('/auth/signin')
    } catch (e) {
      console.error(e)
      showToast({ message: '削除処理に失敗しました', variant: 'error' })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-2xl font-bold text-foreground">プロフィール編集</h1>

        {/* 基本情報カード */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-foreground">基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* アバター + 名前 */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border border-border bg-card flex items-center justify-center">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="アバター" className="w-full h-full object-cover" />
                ) : (
                  <UserRound className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <Label htmlFor="displayName" className="block text-sm text-muted-foreground mb-1">氏名</Label>
                <div className="flex gap-2">
                  <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="flex-1" />
                  <Button onClick={handleSaveName} className="whitespace-nowrap">保存</Button>
                </div>
              </div>
            </div>

            {/* メール */}
            <div>
              <Label htmlFor="email" className="block text-sm text-muted-foreground mb-1">メールアドレス</Label>
              <div className="flex gap-2">
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1" />
                <Button onClick={handleSaveEmail} className="whitespace-nowrap">更新</Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">メール変更には確認メールでの認証が必要です。</p>
            </div>
          </CardContent>
        </Card>

        {/* セキュリティカード */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-foreground">セキュリティ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* パスワード */}
            <div>
              <Label htmlFor="newPassword" className="block text-sm text-muted-foreground mb-1">新しいパスワード</Label>
              <div className="flex gap-2">
                <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="flex-1" />
                <Button onClick={handleSavePassword} disabled={!newPassword} className="whitespace-nowrap">変更</Button>
              </div>
            </div>

            {/* アカウント削除 */}
            <div>
              <Button variant="destructive" onClick={() => setOpenDelete(true)}>アカウントを削除</Button>
            </div>
          </CardContent>
        </Card>

        <Dialog open={openDelete} onOpenChange={setOpenDelete}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>アカウント削除の確認</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">この操作は元に戻せません。本当に削除しますか？</p>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setOpenDelete(false)}>キャンセル</Button>
              <Button variant="destructive" onClick={handleDeleteAccount}>削除する</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}