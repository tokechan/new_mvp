import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuthState } from '@/features/auth/hooks/useAuthState'
import { authService } from '@/features/auth/services/authService'
import { profileService } from '@/features/profile/services/profileService'

// authServiceのモック
jest.mock('@/features/auth/services/authService', () => ({
  authService: {
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(),
  }
}))

// profileServiceのモック
jest.mock('@/features/profile/services/profileService', () => ({
  profileService: {
    ensureProfile: jest.fn(),
  }
}))

// supabaseのモック
jest.mock('@/lib/supabase', () => ({
  createSupabaseBrowserClient: jest.fn(() => ({
    from: jest.fn(() => ({
      upsert: jest.fn().mockResolvedValue({ data: null, error: null })
    }))
  }))
}))

const mockAuthService = authService as jest.Mocked<typeof authService>
const mockProfileService = profileService as jest.Mocked<typeof profileService>

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  user_metadata: { name: 'テストユーザー' },
  app_metadata: {},
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

const mockSession = {
  user: mockUser,
  access_token: 'mock-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Date.now() / 1000 + 3600,
  token_type: 'bearer'
}

describe('useAuthState', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // デフォルトでテスト環境ではない設定
    // process.env.NODE_ENVは読み取り専用のため、Object.definePropertyを使用
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: undefined,
      configurable: true
    })
    Object.defineProperty(process.env, 'NEXT_PUBLIC_SKIP_AUTH', {
      value: undefined,
      configurable: true
    })
  })

  describe('初期化', () => {
    /**
     * 初期状態の確認
     */
    it('should initialize with correct default values', () => {
      mockAuthService.getSession.mockResolvedValue(null)
      mockAuthService.onAuthStateChange.mockReturnValue({
        id: 'mock-subscription-id',
        callback: jest.fn(),
        unsubscribe: jest.fn()
      })

      const { result } = renderHook(() => useAuthState())

      expect(result.current.user).toBeNull()
      expect(result.current.session).toBeNull()
      expect(result.current.loading).toBe(true)
    })

    /**
     * 既存セッションの復元
     */
    it('should restore existing session on mount', async () => {
      mockAuthService.getSession.mockResolvedValue(mockSession)
      mockAuthService.onAuthStateChange.mockReturnValue({
        id: 'mock-subscription-id',
        callback: jest.fn(),
        unsubscribe: jest.fn()
      })
      mockProfileService.ensureProfile.mockResolvedValue()

      const { result } = renderHook(() => useAuthState())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.session).toEqual(mockSession)
      expect(mockProfileService.ensureProfile).toHaveBeenCalledWith(mockUser)
    })

    /**
     * セッション取得エラーの処理
     */
    it('should handle session fetch error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      
      mockAuthService.getSession.mockRejectedValue(new Error('Session fetch failed'))
      mockAuthService.onAuthStateChange.mockReturnValue({
        id: 'mock-subscription-id',
        callback: jest.fn(),
        unsubscribe: jest.fn()
      })

      const { result } = renderHook(() => useAuthState())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.user).toBeNull()
      expect(result.current.session).toBeNull()
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('初期セッション取得エラー'),
        expect.any(Error)
      )

      consoleErrorSpy.mockRestore()
    })
  })

  describe('認証状態の変更', () => {
    /**
     * ログイン時の状態更新
     */
    it('should update state on sign in', async () => {
      let authCallback: ((event: string, session: any) => void) | undefined
      
      mockAuthService.getSession.mockResolvedValue(null)
      mockAuthService.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback
        return {
          id: 'mock-subscription-id',
          callback,
          unsubscribe: jest.fn()
        }
      })
      mockProfileService.ensureProfile.mockResolvedValue()

      const { result } = renderHook(() => useAuthState())

      // 初期状態の確認
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      expect(result.current.user).toBeNull()

      // ログインイベントをシミュレート
      act(() => {
        authCallback?.('SIGNED_IN', mockSession)
      })

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
        expect(result.current.session).toEqual(mockSession)
      })

      expect(mockProfileService.ensureProfile).toHaveBeenCalledWith(mockUser)
    })

    /**
     * ログアウト時の状態更新
     */
    it('should update state on sign out', async () => {
      let authCallback: ((event: string, session: any) => void) | undefined
      
      mockAuthService.getSession.mockResolvedValue(mockSession)
      mockAuthService.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback
        return {
          id: 'mock-subscription-id',
          callback,
          unsubscribe: jest.fn()
        }
      })
      mockProfileService.ensureProfile.mockResolvedValue()

      const { result } = renderHook(() => useAuthState())

      // 初期状態でログイン済み
      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })

      // ログアウトイベントをシミュレート
      act(() => {
        authCallback?.('SIGNED_OUT', null)
      })

      await waitFor(() => {
        expect(result.current.user).toBeNull()
        expect(result.current.session).toBeNull()
      })
    })

    /**
     * プロフィール作成の正常な処理
     */
    it('should call ensureProfile when user is authenticated', async () => {
      mockAuthService.getSession.mockResolvedValue(mockSession)
      mockAuthService.onAuthStateChange.mockReturnValue({
        id: 'mock-subscription-id',
        callback: jest.fn(),
        unsubscribe: jest.fn()
      })
      mockProfileService.ensureProfile.mockResolvedValue()

      const { result } = renderHook(() => useAuthState())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // ユーザーとセッションが設定され、プロフィール作成が呼ばれる
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.session).toEqual(mockSession)
      expect(mockProfileService.ensureProfile).toHaveBeenCalledWith(mockUser)
    })
  })

  describe('テスト環境での動作', () => {
    /**
     * NODE_ENV=testでのモック認証
     */
    it('should use mock authentication in test environment', async () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'test',
        configurable: true
      })
      
      const { result } = renderHook(() => useAuthState())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.user).toEqual(expect.objectContaining({
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com'
      }))
      expect(result.current.session).toEqual(expect.objectContaining({
        access_token: 'mock-token'
      }))

      // 実際のauthServiceは呼ばれない
      expect(mockAuthService.getSession).not.toHaveBeenCalled()
    })

    /**
     * NEXT_PUBLIC_SKIP_AUTH=trueでのモック認証
     */
    it('should use mock authentication when SKIP_AUTH is true', async () => {
      Object.defineProperty(process.env, 'NEXT_PUBLIC_SKIP_AUTH', {
        value: 'true',
        configurable: true
      })
      
      const { result } = renderHook(() => useAuthState())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.user).toEqual(expect.objectContaining({
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com'
      }))
      expect(result.current.session).toEqual(expect.objectContaining({
        access_token: 'mock-token'
      }))
    })

    /**
     * 本番ビルドでのモック認証無効化
     */
    it('should ignore SKIP_AUTH flag in production builds', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        configurable: true
      })
      Object.defineProperty(process.env, 'NEXT_PUBLIC_SKIP_AUTH', {
        value: 'true',
        configurable: true
      })

      mockAuthService.getSession.mockResolvedValue(mockSession)
      mockAuthService.onAuthStateChange.mockReturnValue({
        id: 'mock-subscription-id',
        callback: jest.fn(),
        unsubscribe: jest.fn()
      })
      mockProfileService.ensureProfile.mockResolvedValue()

      const { result } = renderHook(() => useAuthState())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.user).toEqual(mockUser)
      expect(mockAuthService.getSession).toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[security] NEXT_PUBLIC_SKIP_AUTH=true detected in production build. Ignoring for safety.'
      )

      consoleErrorSpy.mockRestore()
    })
  })

  describe('クリーンアップ', () => {
    /**
     * アンマウント時のサブスクリプション解除
     */
    it('should unsubscribe on unmount', () => {
      const unsubscribeMock = jest.fn()
      
      mockAuthService.getSession.mockResolvedValue(null)
      mockAuthService.onAuthStateChange.mockReturnValue({
        id: 'mock-subscription-id',
        callback: jest.fn(),
        unsubscribe: unsubscribeMock
      })

      const { unmount } = renderHook(() => useAuthState())

      unmount()

      expect(unsubscribeMock).toHaveBeenCalled()
    })
  })
})
