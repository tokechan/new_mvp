'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { ValidatedInput } from '@/components/ui/ValidatedInput'
import { useFormValidation, validationRules } from '@/hooks/useFormValidation'

/**
 * サインアップページ
 * 新規ユーザー登録機能
 */
export default function SignUp() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const { signUp, signInWithGoogle } = useAuth()
  const router = useRouter()

  // フォームバリデーション
  const { formState, updateField, touchField, validateAll, clearAllErrors } = useFormValidation({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  // エラーをクリアする関数
  const clearError = () => {
    setError('')
    clearAllErrors()
  }

  // メール認証でのサインアップ処理
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // バリデーション
    const { isValid } = validateAll({
      email: validationRules.email,
      password: validationRules.password,
      confirmPassword: validationRules.confirmPassword(formState.password.value),
      name: validationRules.name
    })

    if (!isValid) {
      setLoading(false)
      return
    }

    try {
      const { error } = await signUp(
        formState.email.value, 
        formState.password.value, 
        formState.name.value
      )
      
      if (error) {
        setError(error.message || 'サインアップに失敗しました')
      } else {
        setSuccess('確認メールを送信しました。メールをチェックしてアカウントを有効化してください。')
        // 3秒後にサインインページにリダイレクト
        setTimeout(() => {
          router.push('/auth/signin')
        }, 3000)
      }
    } catch (err) {
      setError('予期しないエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  // Google認証でのサインアップ処理
  const handleGoogleSignUp = async () => {
    setLoading(true)
    clearError()

    try {
      const { error } = await signInWithGoogle()
      
      if (error) {
        setError(error.message || 'Google認証に失敗しました')
        setLoading(false)
      }
      // 成功時はコールバックページで処理される
    } catch (err) {
      setError('予期しないエラーが発生しました')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-2 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            新しいアカウントを作成
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            または{' '}
            <Link
              href="/auth/signin"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              既存のアカウントでサインイン
            </Link>
          </p>
        </div>
        
        {/* エラーメッセージ */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* 成功メッセージ */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleEmailSignUp} noValidate>
          <div className="space-y-4">
            <ValidatedInput
              label="お名前"
              type="text"
              value={formState.name.value}
              error={formState.name.error}
              touched={formState.name.touched}
              placeholder="山田太郎"
              required
              onChange={(value) => updateField('name', value, validationRules.name)}
              onBlur={() => touchField('name', validationRules.name)}
            />

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
              placeholder="6文字以上"
              required
              onChange={(value) => updateField('password', value, validationRules.password)}
              onBlur={() => touchField('password', validationRules.password)}
            />

            <ValidatedInput
              label="パスワード（確認）"
              type="password"
              value={formState.confirmPassword.value}
              error={formState.confirmPassword.error}
              touched={formState.confirmPassword.touched}
              placeholder="パスワードを再入力"
              required
              onChange={(value) => updateField('confirmPassword', value, validationRules.confirmPassword(formState.password.value))}
              onBlur={() => touchField('confirmPassword', validationRules.confirmPassword(formState.password.value))}
            />
          </div>

          <div>
            <Button
              type="submit"
              disabled={loading}
              variant="default"
              size="default"
              className="w-full"
            >
              {loading ? 'アカウント作成中...' : 'アカウントを作成'}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">または</span>
            </div>
          </div>

          <div>
            <Button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={loading}
              variant="outline"
              size="default"
              className="w-full"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
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
              Googleでサインアップ
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}