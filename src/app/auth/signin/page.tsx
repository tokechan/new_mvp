'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { ValidatedInput } from '@/components/ui/ValidatedInput'
import { useFormValidation, validationRules } from '@/hooks/useFormValidation'

/**
 * サインインページ
 * メール認証とGoogle認証に対応
 */
function SignInContent() {
  const [loading, setLoading] = useState(false)
  const [localError, setLocalError] = useState('')
  
  const { formState, updateField, touchField, validateAll, resetForm } = useFormValidation({
    email: '',
    password: ''
  })
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn, signInWithGoogle, resendConfirmation, error: authError, clearError } = useAuth()

  // URLパラメータからエラーメッセージを取得
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      setLocalError(decodeURIComponent(errorParam))
    }
  }, [searchParams])

  // エラーをクリアする関数
  const clearAllErrors = () => {
    setLocalError('')
    clearError()
  }

  // 表示するエラーメッセージを決定
  const displayError = authError || localError

  // メール認証でのサインイン処理
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    clearAllErrors()

    // バリデーション実行
    const { isValid } = validateAll({
      email: validationRules.email,
      password: validationRules.password
    })

    // バリデーションNGのときは送信を中断
    if (!isValid) {
      setLoading(false)
      return
    }

    try {
      const { error } = await signIn(formState.email.value, formState.password.value)
      
      if (error) {
        // エラーメッセージをより具体的に表示
        let errorMessage = 'サインインに失敗しました'
        
        if (error.message) {
          // Supabaseの認証エラーメッセージを日本語に変換
          const msg = error.message
          if (msg.includes('Invalid login credentials') || 
              msg.includes('invalid_credentials') ||
              msg.includes('Invalid email or password')) {
            errorMessage = 'メールアドレスまたはパスワードが正しくありません。入力内容をご確認ください。'
          } else if (msg.includes('Email not confirmed')) {
            errorMessage = 'メールアドレスの確認が完了していません。確認メールを再送できます。'
          } else if (msg.includes('Too many requests')) {
            errorMessage = 'ログイン試行回数が上限に達しました。しばらく時間をおいてから再度お試しください。'
          } else {
            errorMessage = `サインインに失敗しました: ${error.message}`
          }
        }
        console.debug('🔐 サインイン失敗詳細', { message: error.message })
        setLocalError(errorMessage)
      } else {
        router.push('/')
      }
    } catch (err) {
      setLocalError('予期しないエラーが発生しました。ネットワーク接続をご確認の上、再度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  // Google認証でのサインイン処理
  const handleGoogleSignIn = async () => {
    setLoading(true)
    clearAllErrors()
    resetForm()

    try {
      console.log('Google認証を開始します...')
      const { error } = await signInWithGoogle()
      
      if (error) {
        console.error('Google認証エラー:', error)
        setLocalError(`Google認証に失敗しました: ${error.message}`)
        setLoading(false)
      } else {
        console.log('Google認証リダイレクトが開始されました')
      }
      // 成功時はコールバックページで処理される
    } catch (err) {
      console.error('予期しないエラー:', err)
      setLocalError(`予期しないエラーが発生しました: ${err instanceof Error ? err.message : String(err)}`)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-2 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            アカウントにサインイン
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            または{' '}
            <Link
              href="/auth/signup"
              className="font-medium text-primary hover:text-primary/90"
            >
              新しいアカウントを作成
            </Link>
          </p>
        </div>
        
        {/* エラーメッセージ */}
        {displayError && (
          <div className="bg-destructive/10 border border-destructive/40 text-destructive px-4 py-3 rounded relative">
            <div className="flex justify-between items-center">
              <span>{displayError}</span>
              <button
                type="button"
                onClick={clearAllErrors}
                className="text-destructive hover:text-destructive/80 ml-2"
                aria-label="エラーを閉じる"
              >
                ×
              </button>
            </div>
            {displayError.includes('確認が完了していません') && (
              <div className="mt-3 flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (!formState.email.value) {
                      setLocalError('確認メール再送にはメールアドレスの入力が必要です。')
                      return
                    }
                    const { error } = await resendConfirmation(formState.email.value)
                    if (error) {
                      setLocalError(`確認メールの再送に失敗しました: ${error.message}`)
                    } else {
                      setLocalError('確認メールを再送しました。メールをご確認ください。')
                    }
                  }}
                >
                  確認メールを再送
                </Button>
                <span className="text-sm text-muted-foreground">メールが届かない場合は迷惑メールフォルダもご確認ください。</span>
              </div>
            )}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleEmailSignIn} noValidate>
          <div className="space-y-4">
            <ValidatedInput
              label="メールアドレス"
              type="email"
              value={formState.email.value}
              error={formState.email.error}
              touched={formState.email.touched}
              placeholder="example@example.com"
              required
              onChange={(value) => updateField('email', value, validationRules.email)}
              onBlur={() => touchField('email', validationRules.email)}
            />

            <ValidatedInput
              label="パスワード"
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

          <div>
            <Button
              type="submit"
              variant="default"
              size="default"
              disabled={loading}
              className="w-full"
            >
              サインイン
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted-foreground">または</span>
            </div>
          </div>

          <div>
            <Button
              onClick={handleGoogleSignIn}
              variant="outline"
              size="default"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2"
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Googleでサインイン</span>
              </div>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function SignIn() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInContent />
    </Suspense>
  )
}