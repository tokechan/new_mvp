import { ProfileService } from '@/features/profile/services/profileService'

// モックオブジェクト
let mockSupabase: any

jest.mock('../../lib/supabase', () => ({
  createSupabaseBrowserClient: jest.fn(() => ({
    from: jest.fn(),
    auth: {
      getUser: jest.fn()
    }
  }))
}))

describe('ProfileService', () => {
  let profileService: ProfileService

  beforeEach(() => {
    jest.clearAllMocks()
    
    // 新しいモックインスタンスを作成
    mockSupabase = {
      from: jest.fn(),
      auth: {
        getUser: jest.fn()
      }
    }
    
    // モックの実装を更新
    const { createSupabaseBrowserClient } = require('../../lib/supabase')
    createSupabaseBrowserClient.mockReturnValue(mockSupabase)
    
    profileService = new ProfileService()
  })

  describe('getProfile', () => {
    /**
     * プロフィール取得の正常系テスト
     * 単一責務: ユーザーIDに基づくプロフィール情報の取得
     */
    it('should return user profile', async () => {
      const mockProfile = {
        id: 'user1',
        display_name: 'テストユーザー',
        email: 'test@example.com',
        partner_id: null
      }

      const mockSingleQuery = {
        single: jest.fn().mockResolvedValue({ data: mockProfile, error: null })
      }

      const mockEqQuery = {
        eq: jest.fn().mockReturnValue(mockSingleQuery)
      }

      const mockSelectQuery = {
        select: jest.fn().mockReturnValue(mockEqQuery)
      }

      const mockFromQuery = {
        select: jest.fn().mockReturnValue(mockEqQuery)
      }

      mockSupabase.from.mockReturnValue(mockFromQuery as any)

      const result = await profileService.getProfile('user1')

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
      expect(result).toEqual(mockProfile)
    })

    /**
     * プロフィール取得の異常系テスト
     * 単一責務: 存在しないプロフィールのエラーハンドリング
     */
    it('should throw error when profile not found', async () => {
      const mockError = { message: 'Profile not found', code: 'PGRST116' }
      const mockSingleQuery = {
        single: jest.fn().mockResolvedValue({ data: null, error: mockError })
      }

      const mockEqQuery = {
        eq: jest.fn().mockReturnValue(mockSingleQuery)
      }

      const mockFromQuery = {
        select: jest.fn().mockReturnValue(mockEqQuery)
      }

      mockSupabase.from.mockReturnValue(mockFromQuery as any)

      await expect(profileService.getProfile('nonexistent')).rejects.toEqual(mockError)
    })
  })

  describe('ensureProfile', () => {
    /**
     * プロフィール自動作成の正常系テスト
     * 単一責務: ユーザー認証後のプロフィール自動作成
     */
    it('should ensure profile exists for user', async () => {
      const mockUser = {
        id: 'user1',
        email: 'test@example.com',
        user_metadata: { name: 'テストユーザー' }
      }

      const mockUpsertQuery = {
        upsert: jest.fn().mockResolvedValue({ data: null, error: null })
      }

      const mockFromQuery = {
        upsert: jest.fn().mockResolvedValue({ data: null, error: null })
      }

      mockSupabase.from.mockReturnValue(mockFromQuery as any)

      await profileService.ensureProfile(mockUser as any)

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
    })
  })

  describe('updateProfile', () => {
    /**
     * プロフィール更新の正常系テスト
     * 単一責務: 既存プロフィールの更新
     */
    it('should update a profile', async () => {
      const updates = { display_name: '更新されたユーザー' }
      const updatedProfile = {
        id: 'user1',
        display_name: '更新されたユーザー',
        email: 'test@example.com',
        partner_id: null
      }

      const mockSingleQuery = {
        single: jest.fn().mockResolvedValue({ data: updatedProfile, error: null })
      }

      const mockSelectQuery = {
        select: jest.fn().mockReturnValue(mockSingleQuery)
      }

      const mockEqQuery = {
        eq: jest.fn().mockReturnValue(mockSelectQuery)
      }

      const mockUpdateQuery = {
        eq: jest.fn().mockReturnValue(mockSelectQuery)
      }

      const mockFromQuery = {
        update: jest.fn().mockReturnValue(mockUpdateQuery)
      }

      mockSupabase.from.mockReturnValue(mockFromQuery as any)

      const result = await profileService.updateProfile('user1', updates)

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
      expect(result).toEqual(updatedProfile)
    })

    /**
     * プロフィール更新の異常系テスト
     * 単一責務: 更新失敗時のエラーハンドリング
     */
    it('should throw error when update fails', async () => {
      const mockError = { message: 'Update failed', code: 'PGRST301' }
      const mockSingleQuery = {
        single: jest.fn().mockResolvedValue({ data: null, error: mockError })
      }

      const mockSelectQuery = {
        select: jest.fn().mockReturnValue(mockSingleQuery)
      }

      const mockEqQuery = {
        eq: jest.fn().mockReturnValue(mockSelectQuery)
      }

      const mockFromQuery = {
        update: jest.fn().mockReturnValue(mockEqQuery)
      }

      mockSupabase.from.mockReturnValue(mockFromQuery as any)

      await expect(profileService.updateProfile('user1', { display_name: 'test' })).rejects.toEqual(mockError)
    })
  })

  describe('profileExists', () => {
    /**
     * プロフィール存在確認の正常系テスト
     * 単一責務: プロフィールの存在確認
     */
    it('should return true when profile exists', async () => {
      const mockProfile = { id: 'user1', display_name: 'テストユーザー' }

      const mockSingleQuery = {
        single: jest.fn().mockResolvedValue({ data: mockProfile, error: null })
      }

      const mockEqQuery = {
        eq: jest.fn().mockReturnValue(mockSingleQuery)
      }

      const mockSelectQuery = {
        select: jest.fn().mockReturnValue(mockEqQuery)
      }

      const mockFromQuery = {
        select: jest.fn().mockReturnValue(mockEqQuery)
      }

      mockSupabase.from.mockReturnValue(mockFromQuery as any)

      const result = await profileService.profileExists('user1')

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
      expect(result).toBe(true)
    })

    /**
     * プロフィール存在確認の異常系テスト
     * 単一責務: プロフィールが存在しない場合の確認
     */
    it('should return false when profile does not exist', async () => {
      const mockSingleQuery = {
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
      }

      const mockEqQuery = {
        eq: jest.fn().mockReturnValue(mockSingleQuery)
      }

      const mockFromQuery = {
        select: jest.fn().mockReturnValue(mockEqQuery)
      }

      mockSupabase.from.mockReturnValue(mockFromQuery as any)

      const result = await profileService.profileExists('nonexistent')

      expect(result).toBe(false)
    })
  })
})