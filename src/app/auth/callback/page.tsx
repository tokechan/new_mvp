'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase'

/**
 * 認証コールバック処理コンポーネント
 * PKCEフローに対応したexchangeCodeForSessionを使用
 */
function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createSupabaseBrowserClient()
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 PKCE認証コールバック処理開始')
        console.log('Current URL:', window.location.href)
        
        // URLエラーパラメータをチェック
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')
        
        if (error) {
          console.error('❌ OAuth認証エラー:', error, errorDescription)
          router.push(`/auth/signin?error=${encodeURIComponent(errorDescription || error)}`)
          return
        }

        // Supabaseの自動PKCEフロー処理
        // getSessionは内部でPKCEコード交換を自動実行
        console.log('🔄 Supabase自動PKCE処理実行中...')
        
        const { data, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('❌ セッション取得エラー:', sessionError)
          router.push(`/auth/signin?error=${encodeURIComponent(sessionError.message || 'セッション取得に失敗しました')}`)
          return
        }

        if (!data.session) {
          console.log('ℹ️ セッションが見つかりません。PKCEフローを手動実行します...')
          
          // セッションがない場合、手動でPKCEフローを実行
          const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(window.location.href)
          
          if (exchangeError) {
            console.error('❌ PKCEコード交換エラー:', exchangeError)
            router.push(`/auth/signin?error=${encodeURIComponent(exchangeError.message || 'セッション作成に失敗しました')}`)
            return
          }
          
          if (!exchangeData.session) {
            console.error('❌ セッション作成失敗')
            router.push('/auth/signin?error=セッション作成に失敗しました。再度ログインしてください。')
            return
          }
          
          console.log('✅ PKCE認証成功:', {
            userId: exchangeData.session.user.id,
            email: exchangeData.session.user.email,
            hasAccessToken: !!exchangeData.session.access_token
          })
        } else {
          console.log('✅ セッション取得成功:', {
            userId: data.session.user.id,
            email: data.session.user.email,
            hasAccessToken: !!data.session.access_token
          })
        }
        
        // 認証成功時はホームページにリダイレクト
        router.push('/app')
      } catch (error) {
        console.error('❌ 認証コールバック処理エラー:', error)
        router.push('/auth/signin?error=認証処理中にエラーが発生しました')
      } finally {
        setIsProcessing(false)
      }
    }

    handleAuthCallback()
  }, [router, searchParams, supabase])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">認証処理中...</p>
        {!isProcessing && (
          <p className="text-sm text-muted-foreground mt-2">
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}
