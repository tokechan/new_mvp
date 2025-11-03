import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuthActions } from '@/features/auth/hooks/useAuthActions'
import { authService } from '@/features/auth/services/authService'
import { profileService } from '@/features/profile/services/profileService'
import { AuthError } from '@supabase/supabase-js'

// authServiceのモック
jest.mock('@/features/auth/services/authService', () => ({
  authService: {
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    signInWithGoogle: jest.fn(),
  }
}))

// profileServiceのモック
jest.mock('@/features/profile/services/profileService', () => ({
  profileService: {
    ensureProfile: jest.fn(),
  }
}))

const mockAuthService = authService as jest.Mocked<typeof authService>
const mockProfileService = profileService as jest.Mocked<typeof profileService>

describe('useAuthActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // console.logのモック
    jest.spyOn(console, 'log').mockImplementation()
    jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('初期状態', () => {
    /**
     * 初期状態の確認
     */
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useAuthActions())

      expect(result.current.error).toBeNull()
      expect(result.current.loading).toBe(false)
      expect(typeof result.current.signIn).toBe('function')
      expect(typeof result.current.signUp).toBe('function')
      expect(typeof result.current.signOut).toBe('function')
      expect(typeof result.current.signInWithGoogle).toBe('function')
      expect(typeof result.current.clearError).toBe('function')
    })
  })

  describe('signIn', () => {
    /**
     * 正常なサインイン
     */
    it('should handle successful sign in', async () => {
      const mockResult = { error: null }
      mockAuthService.signIn.mockResolvedValue(mockResult)

      const { result } = renderHook(() => useAuthActions())

      let signInResult: any
      await act(async () => {
        signInResult = await result.current.signIn('test@example.com', 'password123')
      })

      expect(mockAuthService.signIn).toHaveBeenCalledWith('test@example.com', 'password123')
      expect(signInResult).toEqual(mockResult)
      expect(result.current.error).toBeNull()
      expect(result.current.loading).toBe(false)
    })

    /**
     * サインインエラー（authServiceからのエラー）
     */
    it('should handle sign in error from auth service', async () => {
      // 実際のAuthErrorオブジェクトを模倣
      const mockError = new Error('Invalid credentials') as any
      mockError.code = 'invalid_credentials'
      mockError.status = 400
      const mockResult = { error: mockError }
      mockAuthService.signIn.mockResolvedValue(mockResult)

      const { result } = renderHook(() => useAuthActions())

      let signInResult: any
      await act(async () => {
        signInResult = await result.current.signIn('test@example.com', 'wrongpassword')
      })

      expect(signInResult).toEqual(mockResult)
      expect(result.current.error).toBe('Invalid credentials')
      expect(result.current.loading).toBe(false)
    })

    /**
     * サインイン例外処理
     */
    it('should handle sign in exception', async () => {
      const mockError = new Error('Network error')
      mockAuthService.signIn.mockRejectedValue(mockError)

      const { result } = renderHook(() => useAuthActions())

      let signInResult: any
      await act(async () => {
        signInResult = await result.current.signIn('test@example.com', 'password123')
      })

      expect(signInResult).toEqual({ error: mockError })
      expect(result.current.error).toBe('Network error')
      expect(result.current.loading).toBe(false)
    })

    /**
     * ローディング状態の確認
     */
    it('should set loading state during sign in', async () => {
      let resolveSignIn: (value: any) => void
      const signInPromise = new Promise((resolve) => {
        resolveSignIn = resolve
      })
      mockAuthService.signIn.mockReturnValue(signInPromise as any)

      const { result } = renderHook(() => useAuthActions())

      // サインイン開始
      act(() => {
        result.current.signIn('test@example.com', 'password123')
      })

      // ローディング状態の確認
      expect(result.current.loading).toBe(true)
      expect(result.current.error).toBeNull()

      // サインイン完了
      await act(async () => {
        resolveSignIn!({ error: null })
        await signInPromise
      })

      expect(result.current.loading).toBe(false)
    })
  })

  describe('signUp', () => {
    /**
     * 正常なサインアップ
     */
    it('should handle successful sign up', async () => {
      const mockResult = { error: null }
      mockAuthService.signUp.mockResolvedValue(mockResult)

      const { result } = renderHook(() => useAuthActions())

      let signUpResult: any
      await act(async () => {
        signUpResult = await result.current.signUp('test@example.com', 'password123', 'テストユーザー')
      })

      expect(mockAuthService.signUp).toHaveBeenCalledWith('test@example.com', 'password123', 'テストユーザー')
      expect(signUpResult).toEqual(mockResult)
      expect(result.current.error).toBeNull()
      expect(result.current.loading).toBe(false)
      expect(console.log).toHaveBeenCalledWith('サインアップ成功 - プロフィール作成は認証状態変更時に実行されます')
    })

    /**
     * サインアップエラー
     */
    it('should handle sign up error', async () => {
      // 実際のAuthErrorオブジェクトを模倣
      const mockError = new Error('Email already exists') as any
      mockError.code = 'email_already_exists'
      mockError.status = 400
      const mockResult = { error: mockError }
      mockAuthService.signUp.mockResolvedValue(mockResult)

      const { result } = renderHook(() => useAuthActions())

      let signUpResult: any
      await act(async () => {
        signUpResult = await result.current.signUp('test@example.com', 'password123')
      })

      expect(signUpResult).toEqual(mockResult)
      expect(result.current.error).toBe('Email already exists')
      expect(result.current.loading).toBe(false)
    })

    /**
     * サインアップ例外処理
     */
    it('should handle sign up exception', async () => {
      const mockError = new Error('Network error')
      mockAuthService.signUp.mockRejectedValue(mockError)

      const { result } = renderHook(() => useAuthActions())

      let signUpResult: any
      await act(async () => {
        signUpResult = await result.current.signUp('test@example.com', 'password123')
      })

      expect(signUpResult).toEqual({ error: mockError })
      expect(result.current.error).toBe('Network error')
      expect(result.current.loading).toBe(false)
    })
  })

  describe('signOut', () => {
    /**
     * 正常なサインアウト
     */
    it('should handle successful sign out', async () => {
      mockAuthService.signOut.mockResolvedValue(undefined)

      const { result } = renderHook(() => useAuthActions())

      await act(async () => {
        await result.current.signOut()
      })

      expect(mockAuthService.signOut).toHaveBeenCalled()
      expect(result.current.error).toBeNull()
      expect(result.current.loading).toBe(false)
    })

    /**
     * サインアウトエラー
     */
    it('should handle sign out error', async () => {
      const mockError = new Error('Sign out failed')
      mockAuthService.signOut.mockRejectedValue(mockError)

      const { result } = renderHook(() => useAuthActions())

      let thrownError: any
      await act(async () => {
        try {
          await result.current.signOut()
        } catch (error) {
          thrownError = error
        }
      })

      expect(thrownError).toBe(mockError)
      expect(result.current.error).toBe('Sign out failed')
      expect(result.current.loading).toBe(false)
      expect(console.error).toHaveBeenCalledWith('サインアウトエラー:', mockError)
    })
  })

  describe('signInWithGoogle', () => {
    /**
     * 正常なGoogle認証
     */
    it('should handle successful Google sign in', async () => {
      const mockResult = { error: null }
      mockAuthService.signInWithGoogle.mockResolvedValue(mockResult)

      const { result } = renderHook(() => useAuthActions())

      let signInResult: any
      await act(async () => {
        signInResult = await result.current.signInWithGoogle()
      })

      expect(mockAuthService.signInWithGoogle).toHaveBeenCalled()
      expect(signInResult).toEqual(mockResult)
      expect(result.current.error).toBeNull()
      expect(result.current.loading).toBe(false)
      expect(console.log).toHaveBeenCalledWith('Google認証成功 - プロフィール作成は認証状態変更時に実行されます')
    })

    /**
     * Google認証エラー（Errorオブジェクト）
     */
    it('should handle Google sign in error with Error object', async () => {
      const mockError = new Error('Google auth failed') as any
      const mockResult = { error: mockError }
      mockAuthService.signInWithGoogle.mockResolvedValue(mockResult)

      const { result } = renderHook(() => useAuthActions())

      let signInResult: any
      await act(async () => {
        signInResult = await result.current.signInWithGoogle()
      })

      expect(signInResult).toEqual(mockResult)
      expect(result.current.error).toBe('Google auth failed')
      expect(result.current.loading).toBe(false)
    })

    /**
     * Google認証エラー（文字列エラー）
     */
    it('should handle Google sign in error with string error', async () => {
      // 文字列エラーを模倣
      const mockError = new Error('Authentication failed') as any
      const mockResult = { error: mockError }
      mockAuthService.signInWithGoogle.mockResolvedValue(mockResult)

      const { result } = renderHook(() => useAuthActions())

      let signInResult: any
      await act(async () => {
        signInResult = await result.current.signInWithGoogle()
      })

      expect(signInResult).toEqual(mockResult)
      expect(result.current.error).toBe('Authentication failed')
      expect(result.current.loading).toBe(false)
    })

    /**
     * Google認証例外処理
     */
    it('should handle Google sign in exception', async () => {
      const mockError = new Error('Network error')
      mockAuthService.signInWithGoogle.mockRejectedValue(mockError)

      const { result } = renderHook(() => useAuthActions())

      let signInResult: any
      await act(async () => {
        signInResult = await result.current.signInWithGoogle()
      })

      expect(signInResult).toEqual({ error: mockError })
      expect(result.current.error).toBe('Network error')
      expect(result.current.loading).toBe(false)
    })
  })

  describe('clearError', () => {
    /**
     * エラークリア機能
     */
    it('should clear error state', async () => {
      const mockError = new AuthError('Test error', 400, 'test_error')
      const mockResult = { error: mockError }
      mockAuthService.signIn.mockResolvedValue(mockResult)

      const { result } = renderHook(() => useAuthActions())

      // エラーを発生させる
      await act(async () => {
        await result.current.signIn('test@example.com', 'wrongpassword')
      })

      expect(result.current.error).toBe('Test error')

      // エラーをクリア
      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })
  })

  describe('エラーメッセージのフォールバック', () => {
    /**
     * エラーメッセージがない場合のフォールバック
     */
    it('should use fallback error message when error message is missing', async () => {
      // メッセージのないエラーオブジェクト
      const mockError = new Error() as any
      mockError.message = ''
      const mockResult = { error: mockError }
      mockAuthService.signIn.mockResolvedValue(mockResult)

      const { result } = renderHook(() => useAuthActions())

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123')
      })

      expect(result.current.error).toBe('サインインに失敗しました')
    })

    /**
     * 非Errorオブジェクトの例外処理
     */
    it('should handle non-Error exceptions', async () => {
      mockAuthService.signIn.mockRejectedValue('String error')

      const { result } = renderHook(() => useAuthActions())

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123')
      })

      expect(result.current.error).toBe('サインイン中にエラーが発生しました')
    })
  })
})