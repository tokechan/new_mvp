'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/shared/ui/Button'
import { ValidatedInput } from '@/shared/ui/ValidatedInput'
import { useFormValidation, validationRules } from '@/shared/hooks/useFormValidation'

/**
 * 登録済みユーザー向けのWelcome back画面
 * Apple/Google認証またはメール/パスワードでのサインイン
 */
export default function WelcomePage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { signIn, signInWithGoogle, user } = useAuth()

  // フォームバリデーション
  const { formState, updateField, touchField, validateAll, clearAllErrors } = useFormValidation({
    email: '',
    password: ''
  })

  // 既にログイン済みの場合はホームにリダイレクト
  useEffect(() => {
    if (user) {
      router.push('/app')
    }
  }, [user, router])

  // エラーをクリアする関数
  const clearError = () => {
    setError('')
    clearAllErrors()
  }

  // Apple認証（実装予定）
  const handleAppleSignIn = async () => {
    setLoading(true)
    clearError()
    
    try {
      // Apple認証の実装は将来的に追加
      setError('Apple認証は現在準備中です')
    } catch (err) {
      setError('Apple認証に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // Google認証
  const handleGoogleSignIn = async () => {
    setLoading(true)
    clearError()

    try {
      console.log('Google認証を開始します...')
      const { error } = await signInWithGoogle()
      
      if (error) {
        console.error('Google認証エラー:', error)
        setError(`Google認証に失敗しました: ${error.message}`)
        setLoading(false)
      } else {
        console.log('Google認証リダイレクトが開始されました')
      }
    } catch (err) {
      console.error('予期しないエラー:', err)
      setError(`予期しないエラーが発生しました: ${err instanceof Error ? err.message : String(err)}`)
      setLoading(false)
    }
  }

  // メール/パスワード認証
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    clearError()

    // バリデーション
    const { isValid } = validateAll({
      email: validationRules.email,
      password: validationRules.password
    })

    if (!isValid) {
      setLoading(false)
      return
    }

    try {
      const { error } = await signIn(formState.email.value, formState.password.value)
      
      if (error) {
        setError(error.message || 'サインインに失敗しました')
      } else {
        router.push('/app')
      }
    } catch (err) {
      setError('予期しないエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-2 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* ヘッダー */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-gray-900 rounded-lg flex items-center justify-center mb-6">
            <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 114 0 2 2 0 01-4 0zm8-2a2 2 0 100 4 2 2 0 000-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acme Inc.</h1>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
          <p className="text-gray-600">Login with your Apple or Google account</p>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Apple認証ボタン */}
          <Button
            onClick={handleAppleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            Login with Apple
          </Button>

          {/* Google認証ボタン */}
          <Button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Login with Google
          </Button>

          {/* 区切り線 */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* メール/パスワードフォーム */}
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <ValidatedInput
              label="Email"
              type="email"
              value={formState.email.value}
              error={formState.email.error}
              touched={formState.email.touched}
              placeholder="m@example.com"
              required
              onChange={(value) => updateField('email', value, validationRules.email)}
              onBlur={() => touchField('email', validationRules.email)}
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Password</span>
                <button
                  type="button"
                  className="text-sm text-primary hover:text-primary/80"
                  onClick={() => router.push('/auth/forgot-password')}
                >
                  Forgot your password?
                </button>
              </div>
              <ValidatedInput
                label=""
                type="password"
                value={formState.password.value}
                error={formState.password.error}
                touched={formState.password.touched}
                placeholder="パスワードを入力"
                required
                onChange={(value) => updateField('password', value, validationRules.password)}
                onBlur={() => touchField('password', validationRules.password)}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              {loading ? 'サインイン中...' : 'Login'}
            </Button>
          </form>

          {/* サインアップリンク */}
          <div className="text-center">
            <span className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => router.push('/auth/signup')}
                className="font-medium text-primary hover:text-primary/80 underline"
              >
                Sign up
              </button>
            </span>
          </div>

          {/* 利用規約 */}
          <div className="text-center text-xs text-gray-500">
            By clicking continue, you agree to our{' '}
            <button className="underline hover:text-gray-700">
              Terms of Service
            </button>
            {' '}and{' '}
            <button className="underline hover:text-gray-700">
              Privacy Policy
            </button>
            .
          </div>
        </div>
      </div>
    </div>
  )
}
