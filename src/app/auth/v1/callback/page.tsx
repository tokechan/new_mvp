'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase'

/**
 * 認証コールバックページ
 * OAuth認証後のリダイレクトを処理する
 */
export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    console.log('🔄 認証コールバック処理開始')
    
    // URLパラメータを取得
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')
    
    // エラーがある場合は早期リターン
    if (error) {
      console.error('❌ OAuth認証エラー:', error, errorDescription)
      router.push(`/auth/signin?error=${encodeURIComponent(errorDescription || error)}`)
      return
    }

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 認証状態変更:', event, session?.user?.email || 'セッションなし')
        
        if (event === 'SIGNED_IN' && session) {
          console.log('✅ 認証成功:', session.user.email)
          // 認証成功時はホームページにリダイレクト
          router.push('/')
        } else if (event === 'SIGNED_OUT') {
          console.log('❌ 認証失敗またはサインアウト')
          router.push('/auth/signin?error=認証に失敗しました')
        }
      }
    )

    // 現在のセッションもチェック
    const checkCurrentSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        console.log('✅ 既存セッション確認:', session.user.email)
        router.push('/')
      }
    }
    
    checkCurrentSession()

    // クリーンアップ
    return () => {
      subscription.unsubscribe()
    }
  }, [router, searchParams, supabase.auth])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">認証処理中...</p>
      </div>
    </div>
  )
}