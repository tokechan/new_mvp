import { AuthService, authService } from '../authService'
import { createSupabaseBrowserClient } from '@/lib/supabase'

// モック設定
jest.mock('@/lib/supabase', () => ({
  createSupabaseBrowserClient: jest.fn()
}))

describe('AuthService', () => {
  let mockSupabase: any
  let service: AuthService

  beforeEach(() => {
    // Supabaseクライアントのモック
    mockSupabase = {
      auth: {
        signInWithPassword: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        signInWithOAuth: jest.fn(),
        getSession: jest.fn(),
        onAuthStateChange: jest.fn()
      }
    }

    ;(createSupabaseBrowserClient as jest.Mock).mockReturnValue(mockSupabase)
    service = new AuthService()

    // console.logのモック
    jest.spyOn(console, 'log').mockImplementation()
    jest.spyOn(console, 'error').mockImplementation()
    jest.spyOn(console, 'warn').mockImplementation()
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  describe('signIn', () => {
    it('正常なサインインが成功する', async () => {
      const mockResponse = { error: null }
      mockSupabase.auth.signInWithPassword.mockResolvedValue(mockResponse)

      const result = await service.signIn('test@example.com', 'password123')

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
      expect(result).toEqual({ error: null })
    })

    it('サインインエラーが正しく返される', async () => {
      const mockError = { message: 'Invalid credentials' }
      const mockResponse = { error: mockError }
      mockSupabase.auth.signInWithPassword.mockResolvedValue(mockResponse)

      const result = await service.signIn('test@example.com', 'wrongpassword')

      expect(result).toEqual({ error: mockError })
    })

    it('空のメールアドレスでもSupabaseに渡される', async () => {
      const mockResponse = { error: null }
      mockSupabase.auth.signInWithPassword.mockResolvedValue(mockResponse)

      await service.signIn('', 'password123')

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: '',
        password: 'password123'
      })
    })

    it('空のパスワードでもSupabaseに渡される', async () => {
      const mockResponse = { error: null }
      mockSupabase.auth.signInWithPassword.mockResolvedValue(mockResponse)

      await service.signIn('test@example.com', '')

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: ''
      })
    })
  })

  describe('signUp', () => {
    it('名前ありでサインアップが成功する', async () => {
      const mockResponse = { error: null }
      mockSupabase.auth.signUp.mockResolvedValue(mockResponse)

      const result = await service.signUp('test@example.com', 'password123', 'テストユーザー')

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: {
            name: 'テストユーザー'
          }
        }
      })
      expect(result).toEqual({ error: null })
    })

    it('名前なしでサインアップが成功する', async () => {
      const mockResponse = { error: null }
      mockSupabase.auth.signUp.mockResolvedValue(mockResponse)

      const result = await service.signUp('test@example.com', 'password123')

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: {
            name: ''
          }
        }
      })
      expect(result).toEqual({ error: null })
    })

    it('サインアップエラーが正しく返される', async () => {
      const mockError = { message: 'Email already registered' }
      const mockResponse = { error: mockError }
      mockSupabase.auth.signUp.mockResolvedValue(mockResponse)

      const result = await service.signUp('existing@example.com', 'password123')

      expect(result).toEqual({ error: mockError })
    })

    it('undefinedの名前は空文字として扱われる', async () => {
      const mockResponse = { error: null }
      mockSupabase.auth.signUp.mockResolvedValue(mockResponse)

      await service.signUp('test@example.com', 'password123', undefined)

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: {
            name: ''
          }
        }
      })
    })
  })

  describe('signOut', () => {
    it('正常なサインアウトが成功する', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null })

      await expect(service.signOut()).resolves.not.toThrow()
      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    })

    it('サインアウトエラーが例外として投げられる', async () => {
      const mockError = new Error('Sign out failed')
      mockSupabase.auth.signOut.mockResolvedValue({ error: mockError })

      await expect(service.signOut()).rejects.toThrow('Sign out failed')
    })
  })

  describe('signInWithGoogle', () => {

    it('Google OAuth サインインが成功する', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({ error: null })

      const result = await service.signInWithGoogle()

      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost/auth/callback'
        }
      })
      expect(result).toEqual({ error: null })
    })

    it('Google OAuth エラーが正しく処理される', async () => {
      const mockError = { message: 'OAuth failed' }
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({ error: mockError })

      const result = await service.signInWithGoogle()

      expect(result).toEqual({ error: mockError })
      expect(console.error).toHaveBeenCalledWith('Supabase OAuth エラー:', mockError)
    })

    it('予期しない例外が正しく処理される', async () => {
      const mockError = new Error('Unexpected error')
      mockSupabase.auth.signInWithOAuth.mockRejectedValue(mockError)

      const result = await service.signInWithGoogle()

      expect(result).toEqual({ error: mockError })
      expect(console.error).toHaveBeenCalledWith('OAuth 予期しないエラー:', mockError)
    })

    it('適切なログが出力される', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({ error: null })

      await service.signInWithGoogle()

      expect(console.log).toHaveBeenCalledWith('Supabase Google OAuth開始...')
      expect(console.log).toHaveBeenCalledWith('リダイレクトURL:', 'http://localhost/auth/callback')
      expect(console.log).toHaveBeenCalledWith('OAuth リダイレクト成功')
    })
  })

  describe('getSession', () => {
    it('既存のセッションが正しく返される', async () => {
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' },
        access_token: 'token123'
      }
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession }
      })

      const result = await service.getSession()

      expect(result).toBe(mockSession)
      expect(mockSupabase.auth.getSession).toHaveBeenCalled()
    })

    it('セッションがない場合はnullが返される（本番環境）', async () => {
      const originalEnv = process.env.NODE_ENV
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        configurable: true
      })

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null }
      })

      const result = await service.getSession()

      expect(result).toBeNull()
      
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        configurable: true
      })
    })

    it('テスト環境でセッションがない場合、自動ログインを試行する', async () => {
      const originalEnv = process.env.NODE_ENV
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'test',
        configurable: true
      })

      const mockTestSession = {
        user: { id: 'test-user', email: 'test@example.com' },
        access_token: 'test-token'
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null }
      })
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: mockTestSession },
        error: null
      })

      const result = await service.getSession()

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'testpassword123'
      })
      expect(result).toBe(mockTestSession)
      expect(console.log).toHaveBeenCalledWith('テスト環境: 自動ログインを試行します')
      expect(console.log).toHaveBeenCalledWith('テスト用自動ログイン成功')

      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        configurable: true
      })
    })

    it('SKIP_AUTH環境変数が設定されている場合、自動ログインを試行する', async () => {
      const originalSkipAuth = process.env.NEXT_PUBLIC_SKIP_AUTH
      process.env.NEXT_PUBLIC_SKIP_AUTH = 'true'

      const mockTestSession = {
        user: { id: 'test-user', email: 'test@example.com' },
        access_token: 'test-token'
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null }
      })
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: mockTestSession },
        error: null
      })

      const result = await service.getSession()

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'testpassword123'
      })
      expect(result).toBe(mockTestSession)

      process.env.NEXT_PUBLIC_SKIP_AUTH = originalSkipAuth
    })

    it('テスト環境での自動ログインが失敗した場合、警告ログが出力される', async () => {
      const originalEnv = process.env.NODE_ENV
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'test',
        configurable: true
      })

      const mockError = { message: 'Auto login failed' }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null }
      })
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: null },
        error: mockError
      })

      const result = await service.getSession()

      expect(result).toBeNull()
      expect(console.warn).toHaveBeenCalledWith('テスト用自動ログイン失敗:', 'Auto login failed')

      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        configurable: true
      })
    })

    it('テスト環境での自動ログインで例外が発生した場合、警告ログが出力される', async () => {
      const originalEnv = process.env.NODE_ENV
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'test',
        configurable: true
      })

      const mockError = new Error('Unexpected error')

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null }
      })
      mockSupabase.auth.signInWithPassword.mockRejectedValue(mockError)

      const result = await service.getSession()

      expect(result).toBeNull()
      expect(console.warn).toHaveBeenCalledWith('テスト用自動ログイン例外:', mockError)

      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        configurable: true
      })
    })
  })

  describe('onAuthStateChange', () => {
    it('認証状態変更の監視が正しく設定される', () => {
      const mockSubscription = { unsubscribe: jest.fn() }
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: mockSubscription }
      })

      const mockCallback = jest.fn()
      const result = service.onAuthStateChange(mockCallback)

      expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalledWith(mockCallback)
      expect(result).toBe(mockSubscription)
    })

    it('コールバック関数が正しく渡される', () => {
      const mockSubscription = { unsubscribe: jest.fn() }
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: mockSubscription }
      })

      const mockCallback = jest.fn()
      service.onAuthStateChange(mockCallback)

      expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalledWith(mockCallback)
    })
  })

  describe('シングルトンインスタンス', () => {
    it('authServiceがAuthServiceのインスタンスである', () => {
      expect(authService).toBeInstanceOf(AuthService)
    })

    it('複数回インポートしても同じインスタンスが返される', () => {
      const { authService: authService1 } = require('../authService')
      const { authService: authService2 } = require('../authService')
      
      expect(authService1).toBe(authService2)
    })
  })

  describe('エラーハンドリング', () => {
    it('Supabaseクライアントの初期化エラーが適切に処理される', () => {
      ;(createSupabaseBrowserClient as jest.Mock).mockImplementation(() => {
        throw new Error('Supabase initialization failed')
      })

      expect(() => new AuthService()).toThrow('Supabase initialization failed')
    })

    it('ネットワークエラーが適切に処理される', async () => {
      mockSupabase.auth.signInWithPassword.mockRejectedValue(new Error('Network error'))

      await expect(service.signIn('test@example.com', 'password123')).rejects.toThrow('Network error')
    })
  })

  describe('境界値テスト', () => {
    it('非常に長いメールアドレスでも処理される', async () => {
      const longEmail = 'a'.repeat(1000) + '@example.com'
      mockSupabase.auth.signInWithPassword.mockResolvedValue({ error: null })

      await service.signIn(longEmail, 'password123')

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: longEmail,
        password: 'password123'
      })
    })

    it('非常に長いパスワードでも処理される', async () => {
      const longPassword = 'a'.repeat(1000)
      mockSupabase.auth.signInWithPassword.mockResolvedValue({ error: null })

      await service.signIn('test@example.com', longPassword)

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: longPassword
      })
    })

    it('特殊文字を含むメールアドレスでも処理される', async () => {
      const specialEmail = 'test+special@example.com'
      mockSupabase.auth.signInWithPassword.mockResolvedValue({ error: null })

      await service.signIn(specialEmail, 'password123')

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: specialEmail,
        password: 'password123'
      })
    })
  })
})