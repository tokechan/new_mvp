'use client'

import { useState } from 'react'
import { authService } from '@/services/authService'

/**
 * 認証操作を管理するカスタムフック
 * 単一責務: 認証関連のアクション（サインイン、サインアップ、サインアウト）
 */
export function useAuthActions() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  /**
   * メールアドレスとパスワードでサインイン
   */
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)
      const result = await authService.signIn(email, password)
      if (result.error) {
        setError(result.error.message || 'サインインに失敗しました')
      }
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'サインイン中にエラーが発生しました'
      setError(errorMessage)
      return { error: err }
    } finally {
      setLoading(false)
    }
  }

  /**
   * メールアドレスとパスワードでサインアップ
   */
  const signUp = async (email: string, password: string, name?: string) => {
    try {
      setLoading(true)
      setError(null)
      const result = await authService.signUp(email, password, name)
      if (result.error) {
        setError(result.error.message || 'サインアップに失敗しました')
      }
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'サインアップ中にエラーが発生しました'
      setError(errorMessage)
      return { error: err }
    } finally {
      setLoading(false)
    }
  }

  /**
   * サインアウト
   */
  const signOut = async () => {
    try {
      setLoading(true)
      setError(null)
      await authService.signOut()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'サインアウト中にエラーが発生しました'
      setError(errorMessage)
      console.error('サインアウトエラー:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  /**
   * Googleでサインイン
   */
  const signInWithGoogle = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await authService.signInWithGoogle()
      if (result.error) {
        const errorMessage = (result.error instanceof Error ? result.error.message : null) || 'Google認証に失敗しました'
        setError(errorMessage)
      }
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Google認証中に予期しないエラーが発生しました'
      setError(errorMessage)
      return { error: err }
    } finally {
      setLoading(false)
    }
  }

  /**
   * エラーをクリアする関数
   */
  const clearError = () => {
    setError(null)
  }

  return {
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    clearError,
    error,
    loading,
  }
}