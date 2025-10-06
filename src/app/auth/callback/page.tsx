'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase'

/**
 * 認証コールバック処理コンポーネント
 */
function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 認証コールバック処理開始')
        
        // URLパラメータを取得
        const code = searchParams.get('code')
        const error = searchParams.get('error')
        
        console.log('📋 URLパラメータ:', { code: code ? 'あり' : 'なし', error })
        
        // エラーがある場合は早期リターン
        if (error) {
          console.error('❌ OAuth認証エラー:', error)
          router.push('/auth/signin?error=認証に失敗しました')
          return
        }

        // codeがない場合もエラー
        if (!code) {
          console.error('❌ 認証コードが見つかりません')
          router.push('/auth/signin?error=認証コードが見つかりません')
          return
        }

        console.log('🔄 認証コード交換処理開始')
        
        // PKCEフローでコードをセッションに交換
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        
        if (exchangeError) {
          console.error('❌ コード交換エラー:', exchangeError)
          router.push('/auth/signin?error=認証処理に失敗しました')
          return
        }

        if (data.session) {
          console.log('✅ 認証成功:', data.session.user.email)
          // 認証成功時はホームページにリダイレクト
          router.push('/')
        } else {
          console.error('❌ セッションが作成されませんでした')
          router.push('/auth/signin?error=セッションの作成に失敗しました')
        }
      } catch (error) {
        console.error('💥 認証コールバック処理エラー:', error)
        router.push('/auth/signin?error=認証処理中にエラーが発生しました')
      }
    }

    handleAuthCallback()
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

/**
 * 認証コールバックページ
 * OAuth認証後のリダイレクトを処理する
 */
export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}