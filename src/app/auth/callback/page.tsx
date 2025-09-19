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
        console.log('認証コールバック処理開始...')
        console.log('現在のURL:', window.location.href)
        
        // URLパラメータからエラーを確認
        const urlParams = new URLSearchParams(window.location.search)
        const errorParam = urlParams.get('error')
        const errorDescription = urlParams.get('error_description')
        
        if (errorParam) {
          console.error('OAuth認証エラー:', { error: errorParam, description: errorDescription })
          const errorMessage = errorDescription || errorParam || 'OAuth認証に失敗しました'
          router.push(`/auth/signin?error=${encodeURIComponent(errorMessage)}`)
          return
        }
        
        // OAuth認証コードを処理してセッションを取得
        const { data, error } = await supabase.auth.getUser()
        
        console.log('ユーザー取得結果:', { 
          user: data.user ? { id: data.user.id, email: data.user.email } : null, 
          error 
        })
        
        if (error) {
          console.error('ユーザー取得エラー:', error)
          router.push(`/auth/signin?error=${encodeURIComponent(error.message)}`)
          return
        }

        if (data.user) {
          console.log('認証成功、ホームページにリダイレクト')
          // 認証成功時はホームページにリダイレクト
          router.push('/')
        } else {
          console.log('ユーザー情報なし、サインインページにリダイレクト')
          // ユーザー情報がない場合はサインインページにリダイレクト
          router.push('/auth/signin?error=認証情報が見つかりません')
        }
      } catch (error) {
        console.error('認証コールバック処理エラー:', error)
        const errorMessage = error instanceof Error ? error.message : '認証処理中にエラーが発生しました'
        router.push(`/auth/signin?error=${encodeURIComponent(errorMessage)}`)
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