'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase'

/**
 * 認証コールバックページ
 * OAuth認証後のリダイレクトを処理する
 */
export default function AuthCallback() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // URLからコードを取得してセッションを交換
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('認証エラー:', error)
          router.push('/auth/signin?error=認証に失敗しました')
          return
        }

        if (data.session) {
          // 認証成功時はホームページにリダイレクト
          router.push('/')
        } else {
          // セッションがない場合はサインインページにリダイレクト
          router.push('/auth/signin')
        }
      } catch (error) {
        console.error('認証コールバック処理エラー:', error)
        router.push('/auth/signin?error=認証処理中にエラーが発生しました')
      }
    }

    handleAuthCallback()
  }, [router, supabase.auth])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">認証処理中...</p>
      </div>
    </div>
  )
}