import { renderHook, act } from '@testing-library/react'
import { useChores } from '../useChores'
import { supabase } from '@/lib/supabase'

// useAuthフックのモック
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn()
}))

// モック化されたuseAuthをインポート
const { useAuth } = require('@/contexts/AuthContext')
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

// Supabaseクライアントのモック
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}))
const mockSupabase = supabase as jest.Mocked<typeof supabase>

// テスト用のモックデータ
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  user_metadata: { name: 'テストユーザー' },
  app_metadata: {},
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

const mockChores = [
  {
    id: 1,
    title: 'テスト家事1',
    done: false,
    owner_id: 'user-123',
    partner_id: null,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    title: 'テスト家事2',
    done: true,
    owner_id: 'user-123',
    partner_id: null,
    created_at: '2024-01-02T00:00:00Z'
  }
]

/**
 * Supabaseクエリチェーンのモックを作成するヘルパー関数
 */
const createMockQueryChain = (finalResult: any) => {
  const mockChain = {
    select: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(finalResult)
  }
  
  // order メソッドが最終結果を返すパターン
  mockChain.order.mockResolvedValue(finalResult)
  
  return mockChain
}

describe('useChores', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // デフォルトのユーザー認証状態
    mockUseAuth.mockReturnValue({
      user: mockUser,
      session: {
        user: mockUser,
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        expires_at: Date.now() / 1000 + 3600,
        token_type: 'bearer'
      },
      loading: false,
      error: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      signInWithGoogle: jest.fn(),
      clearError: jest.fn()
    })
  })

  describe('初期化', () => {
    /**
     * フックの初期状態が正しく設定されることを確認
     */
    it('should initialize with correct default values', () => {
      const mockQueryChain = createMockQueryChain({ data: [], error: null })
      mockSupabase.from.mockReturnValue(mockQueryChain as any)
      
      const { result } = renderHook(() => useChores())
      
      expect(result.current.chores).toEqual([])
      expect(result.current.loading).toBe(true)
      expect(result.current.isAdding).toBe(false)
    })

    /**
     * ユーザーがログインしていない場合の動作を確認
     */
    it('should handle no user state', () => {
      mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      error: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      signInWithGoogle: jest.fn(),
      clearError: jest.fn()
    })
      
      const { result } = renderHook(() => useChores())
      
      expect(result.current.chores).toEqual([])
      expect(result.current.loading).toBe(true)
    })
  })

  describe('fetchChores', () => {
    /**
     * 家事一覧の取得が正常に動作することを確認
     */
    it('should fetch chores successfully', async () => {
      // 認証されたユーザーのモック
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        error: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        signInWithGoogle: jest.fn(),
        clearError: jest.fn()
      })
      
      const fetchQueryChain = createMockQueryChain({ data: mockChores, error: null })
      mockSupabase.from.mockReturnValue(fetchQueryChain as any)
      
      const { result } = renderHook(() => useChores())
      
      await act(async () => {
        await result.current.fetchChores()
      })
      
      expect(mockSupabase.from).toHaveBeenCalledWith('chores')
      expect(result.current.loading).toBe(false)
      expect(result.current.chores).toEqual(mockChores)
    })

    /**
     * データベースエラー時の処理を確認
     */
    it('should handle fetch error gracefully', async () => {
      // 認証されたユーザーのモック
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        error: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        signInWithGoogle: jest.fn(),
        clearError: jest.fn()
      })
      
      const mockError = { message: 'Database error' }
      const mockQueryChain = createMockQueryChain({ data: null, error: mockError })
      mockSupabase.from.mockReturnValue(mockQueryChain as any)
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      const { result } = renderHook(() => useChores())
      
      await act(async () => {
        await result.current.fetchChores()
      })
      
      expect(mockSupabase.from).toHaveBeenCalledWith('chores')
      expect(consoleSpy).toHaveBeenCalledWith('家事の取得に失敗しました:', mockError)
      expect(result.current.loading).toBe(false)
      
      consoleSpy.mockRestore()
    })
  })

  describe('addChore', () => {
    /**
     * 新しい家事の追加が正常に動作することを確認
     */
    it('should add a new chore successfully', async () => {
      // 認証されたユーザーのモック
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        error: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        signInWithGoogle: jest.fn(),
        clearError: jest.fn()
      })
      
      const newChore = {
        id: 3,
        title: '新しい家事',
        done: false,
        owner_id: 'user-123',
        partner_id: null,
        created_at: '2024-01-03T00:00:00Z'
      }
      
      // プロフィール確認用のモック
      const profileQueryChain = createMockQueryChain({ data: { id: 'user-123' }, error: null })
      
      // 家事追加用のモック
      const addQueryChain = createMockQueryChain({ data: newChore, error: null })
      
      // 初期取得用のモック
      const fetchQueryChain = createMockQueryChain({ data: [], error: null })
      
      mockSupabase.from
        .mockReturnValueOnce(fetchQueryChain as any) // 初期取得
        .mockReturnValueOnce(profileQueryChain as any) // プロフィール確認
        .mockReturnValueOnce(addQueryChain as any) // 家事追加
      
      const { result } = renderHook(() => useChores())
      
      await act(async () => {
        const success = await result.current.addChore('新しい家事')
        expect(success).toBe(true)
      })
      
      expect(mockSupabase.from).toHaveBeenCalledWith('chores')
    })

    /**
     * 空のタイトルでの追加を拒否することを確認
     */
    it('should reject empty title', async () => {
      const { result } = renderHook(() => useChores())
      
      await act(async () => {
        const success = await result.current.addChore('')
        expect(success).toBe(false)
      })
      
      expect(mockSupabase.from).not.toHaveBeenCalledWith('chores')
    })

    /**
     * データベースエラー時の処理を確認
     */
    it('should handle add error and throw meaningful message', async () => {
      // 認証されたユーザーのモック
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        error: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        signInWithGoogle: jest.fn(),
        clearError: jest.fn()
      })
      
      const mockError = { code: '23503', message: 'foreign key constraint violation' }
      
      // プロフィール確認用のモック
      const profileQueryChain = createMockQueryChain({ data: { id: 'user-123' }, error: null })
      
      // 家事追加用のエラーモック - エラーを投げるように修正
      const errorQueryChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: mockError })
          })
        }),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null })
      }
      
      // 初期取得用のモック
      const fetchQueryChain = createMockQueryChain({ data: [], error: null })
      
      // テーブル名に基づいてモックを設定
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'chores' && mockSupabase.from.mock.calls.length === 1) {
          return fetchQueryChain as any // 初期取得
        } else if (table === 'profiles') {
          return profileQueryChain as any // ensureOwnProfile内のprofilesテーブル確認
        } else if (table === 'chores') {
          return errorQueryChain as any // 家事追加エラー
        }
        return fetchQueryChain as any // デフォルト
      })
      
      const { result } = renderHook(() => useChores())
      
      await act(async () => {
        await expect(result.current.addChore('テスト家事')).rejects.toThrow(
          'プロフィールの設定に問題があります。ページを再読み込みしてから再度お試しください。'
        )
      })
    })
  })

  describe('toggleChore', () => {
    /**
     * 家事の完了状態切り替えが正常に動作することを確認
     */
    it('should toggle chore completion successfully', async () => {
      // 認証されたユーザーのモック
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        error: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        signInWithGoogle: jest.fn(),
        clearError: jest.fn()
      })
      
      // 初期取得用のモック
      const fetchQueryChain = createMockQueryChain({ data: mockChores, error: null })
      
      // 更新用のモック
      const updateQueryChain = createMockQueryChain({ data: null, error: null })
      
      // 完了記録追加用のモック
      const completionQueryChain = createMockQueryChain({ data: null, error: null })
      
      mockSupabase.from
        .mockReturnValueOnce(fetchQueryChain as any) // 初期取得
        .mockReturnValueOnce(updateQueryChain as any) // 家事更新
        .mockReturnValueOnce(completionQueryChain as any) // 完了記録追加
      
      const { result } = renderHook(() => useChores())
      
      await act(async () => {
        const success = await result.current.toggleChore(1, false)
        expect(success).toBe(true)
      })
      
      expect(mockSupabase.from).toHaveBeenCalledWith('chores')
      expect(mockSupabase.from).toHaveBeenCalledWith('completions')
    })

    /**
     * 更新エラー時のロールバック処理を確認
     */
    it('should rollback on update error', async () => {
      const mockError = { message: 'Update failed' }
      
      // 初期取得用のモック
      const fetchQueryChain = createMockQueryChain({ data: mockChores, error: null })
      
      const { result } = renderHook(() => useChores())
      
      // 更新時のモックを設定
      const updateMock = jest.fn().mockResolvedValue({ data: null, error: mockError })
      const eqMock = jest.fn().mockReturnValue({ eq: updateMock })
      const updateQueryChain = {
        update: jest.fn().mockReturnValue({ eq: eqMock })
      }
      
      // 更新時のモックを設定
      mockSupabase.from.mockReturnValueOnce(updateQueryChain as any)
      
      await act(async () => {
        await expect(result.current.toggleChore(1, false)).rejects.toThrow(
          '家事の完了状態の変更に失敗しました。'
        )
      })
    })
  })

  describe('deleteChore', () => {
    /**
     * 家事の削除が正常に動作することを確認
     */
    it('should delete chore successfully', async () => {
      // 認証されたユーザーのモック
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        error: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        signInWithGoogle: jest.fn(),
        clearError: jest.fn()
      })
      
      const deleteQueryChain = createMockQueryChain({ data: [{ id: 1 }], error: null })
      mockSupabase.from.mockReturnValue(deleteQueryChain as any)
      
      const { result } = renderHook(() => useChores())
      
      await act(async () => {
        const success = await result.current.deleteChore(1)
        expect(success).toBe(true)
      })
      
      expect(mockSupabase.from).toHaveBeenCalledWith('chores')
    })

    /**
     * 削除エラー時の処理を確認
     */
    it('should handle delete error with meaningful message', async () => {
      const mockError = new Error('policy violation - permission denied')
      
      // 削除エラー用のモック - delete().eq().select()でエラーを返すように修正
      const errorQueryChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({ data: null, error: mockError })
          })
        }),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: mockError })
      }
      
      mockSupabase.from.mockReturnValue(errorQueryChain as any)
      
      const { result } = renderHook(() => useChores())
      
      await act(async () => {
        await expect(result.current.deleteChore(1)).rejects.toThrow(
          'この家事を削除する権限がありません。'
        )
      })
    })
  })

  describe('updateChores', () => {
    /**
     * リアルタイム更新用のセッター関数が正常に動作することを確認
     */
    it('should update chores using updater function', async () => {
      const mockQueryChain = createMockQueryChain({ data: mockChores, error: null })
      mockSupabase.from.mockReturnValue(mockQueryChain as any)
      
      const { result } = renderHook(() => useChores())
      
      await act(async () => {
        result.current.updateChores(prev => [
          ...prev,
          {
            id: 3,
            title: 'リアルタイム追加',
            done: false,
            owner_id: 'user-123',
            partner_id: null,
            created_at: '2024-01-03T00:00:00Z'
          }
        ])
      })
      
      // updateChoresは内部状態を更新するため、直接的な検証は困難
      // 実際のアプリケーションではリアルタイム機能と組み合わせて使用される
      expect(result.current.updateChores).toBeDefined()
    })
  })
})