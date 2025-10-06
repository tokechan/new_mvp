'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase'

/**
 * 認証コールバック処理コンポーネント
 */
function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createSupabaseBrowserClient()
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    console.log('🔄 認証コールバック処理開始')
    
    const handleAuthCallback = async () => {
      try {
        // URLパラメータを取得
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')
        
        // エラーがある場合は早期リターン
        if (error) {
          console.error('❌ OAuth認証エラー:', error, errorDescription)
          router.push(`/auth/signin?error=${encodeURIComponent(errorDescription || error)}`)
          return
        }

        // 現在のセッションを確認
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('❌ セッション取得エラー:', sessionError)
          router.push('/auth/signin?error=認証に失敗しました')
          return
        }

        if (session) {
          console.log('✅ 認証成功:', session.user.email)
          // 認証成功時はホームページにリダイレクト
          router.push('/')
        } else {
          console.log('⏳ セッション待機中...')
          
          // セッションがない場合は認証状態の変更を監視
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
              console.log('🔄 認証状態変更:', event, newSession?.user?.email || 'セッションなし')
              
              if (event === 'SIGNED_IN' && newSession) {
                console.log('✅ 認証成功（状態変更）:', newSession.user.email)
                subscription.unsubscribe()
                router.push('/')
              } else if (event === 'SIGNED_OUT') {
                console.log('❌ 認証失敗またはサインアウト')
                subscription.unsubscribe()
                router.push('/auth/signin?error=認証に失敗しました')
              }
            }
          )

          // タイムアウト処理（30秒後）
          setTimeout(() => {
            console.log('⏰ 認証タイムアウト')
            subscription.unsubscribe()
            router.push('/auth/signin?error=認証がタイムアウトしました')
          }, 30000)
        }
      } catch (error) {
        console.error('❌ 認証コールバック処理エラー:', error)
        router.push('/auth/signin?error=認証処理中にエラーが発生しました')
      } finally {
        setIsProcessing(false)
      }
    }

    handleAuthCallback()
  }, [router, searchParams, supabase.auth])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">認証処理中...</p>
        {!isProcessing && (
          <p className="text-sm text-gray-500 mt-2">
            処理に時間がかかっています。しばらくお待ちください。
          </p>
        )}
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