import { PartnerService } from '@/features/partners/services/partnerService'

// Supabaseクライアントをモック化
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}))

import { supabase } from '@/lib/supabase'

// モックされたsupabaseクライアント
const mockSupabase = supabase as any

describe('PartnerService', () => {
  const mockUserId = 'user-123'
  const mockPartnerId = 'partner-456'
  const mockEmail = 'test@example.com'

  const mockProfile = {
    id: mockUserId,
    display_name: 'テストユーザー',
    partner_id: null,
    partnership_created_at: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }

  const mockPartnerProfile = {
    id: mockPartnerId,
    display_name: 'パートナー',
    partner_id: mockUserId,
    partnership_created_at: '2024-01-01T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // コンソールエラーをモック化してテスト出力をクリーンに保つ
    jest.spyOn(console, 'error').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('getProfile', () => {
    it('正常にプロフィールを取得できる', async () => {
      const mockSelect = {
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockProfile,
          error: null
        })
      }
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue(mockSelect)
      })

      const result = await PartnerService.getProfile(mockUserId)

      expect(result).toEqual(mockProfile)
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
      expect(mockSelect.eq).toHaveBeenCalledWith('id', mockUserId)
    })

    it('プロフィールが見つからない場合はnullを返す', async () => {
      const mockSelect = {
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' }
        })
      }
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue(mockSelect)
      })

      const result = await PartnerService.getProfile(mockUserId)

      expect(result).toBeNull()
    })

    it('データベースエラーの場合は例外を投げる', async () => {
      const mockSelect = {
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'OTHER_ERROR', message: 'Database error' }
        })
      }
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue(mockSelect)
      })

      await expect(PartnerService.getProfile(mockUserId)).rejects.toThrow(
        'プロフィールの取得に失敗しました: Database error'
      )
    })
  })

  describe('upsertProfile', () => {
    const profileData = { display_name: '新しい名前' }

    it('正常にプロフィールを作成/更新できる', async () => {
      const mockUpsert = {
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...mockProfile, ...profileData },
          error: null
        })
      }
      mockSupabase.from.mockReturnValue({
        upsert: jest.fn().mockReturnValue(mockUpsert)
      })

      const result = await PartnerService.upsertProfile(mockUserId, profileData)

      expect(result).toEqual({ ...mockProfile, ...profileData })
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
    })

    it('データベースエラーの場合は例外を投げる', async () => {
      const mockUpsert = {
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Upsert failed' }
        })
      }
      mockSupabase.from.mockReturnValue({
        upsert: jest.fn().mockReturnValue(mockUpsert)
      })

      await expect(PartnerService.upsertProfile(mockUserId, profileData)).rejects.toThrow(
        'プロフィールの作成/更新に失敗しました: Upsert failed'
      )
    })
  })

  describe('getPartnerInfo', () => {
    it('正常にパートナー情報を取得できる', async () => {
      // 最初のクエリ: ユーザーのプロフィールを取得
      const mockUserSelect = {
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { partner_id: mockPartnerId },
          error: null
        })
      }

      // 2番目のクエリ: パートナーの詳細情報を取得
      const mockPartnerSelect = {
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockPartnerProfile,
          error: null
        })
      }

      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue(mockUserSelect)
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue(mockPartnerSelect)
        })

      const result = await PartnerService.getPartnerInfo(mockUserId)

      expect(result).toEqual(mockPartnerProfile)
      expect(mockSupabase.from).toHaveBeenCalledTimes(2)
      expect(mockUserSelect.eq).toHaveBeenCalledWith('id', mockUserId)
      expect(mockPartnerSelect.eq).toHaveBeenCalledWith('id', mockPartnerId)
    })

    it('ユーザーのプロフィールが見つからない場合はnullを返す', async () => {
      const mockSelect = {
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' }
        })
      }
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue(mockSelect)
      })

      const result = await PartnerService.getPartnerInfo(mockUserId)

      expect(result).toBeNull()
    })

    it('パートナーIDがない場合はnullを返す', async () => {
      const mockSelect = {
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { partner_id: null },
          error: null
        })
      }
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue(mockSelect)
      })

      const result = await PartnerService.getPartnerInfo(mockUserId)

      expect(result).toBeNull()
    })

    it('パートナーのプロフィールが見つからない場合はnullを返す', async () => {
      const mockUserSelect = {
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { partner_id: mockPartnerId },
          error: null
        })
      }

      const mockPartnerSelect = {
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' }
        })
      }

      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue(mockUserSelect)
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue(mockPartnerSelect)
        })

      const result = await PartnerService.getPartnerInfo(mockUserId)

      expect(result).toBeNull()
    })

    it('データベースエラーの場合は例外を投げる', async () => {
      const mockSelect = {
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'OTHER_ERROR', message: 'Database error' }
        })
      }
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue(mockSelect)
      })

      await expect(PartnerService.getPartnerInfo(mockUserId)).rejects.toThrow(
        'パートナー情報の取得に失敗しました: Database error'
      )
    })
  })

  describe('linkPartner', () => {
    it('正常にパートナーとのリンクを確立できる', async () => {
      const mockUpdate = {
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      }

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue(mockUpdate)
      })

      await expect(PartnerService.linkPartner(mockUserId, mockPartnerId)).resolves.toBeUndefined()

      expect(mockSupabase.from).toHaveBeenCalledTimes(2)
      expect(mockUpdate.eq).toHaveBeenCalledWith('id', mockUserId)
      expect(mockUpdate.eq).toHaveBeenCalledWith('id', mockPartnerId)
    })

    it('ユーザー側のリンク設定に失敗した場合は例外を投げる', async () => {
      const mockUpdate = {
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'User update failed' }
        })
      }

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue(mockUpdate)
      })

      await expect(PartnerService.linkPartner(mockUserId, mockPartnerId)).rejects.toThrow(
        'ユーザー側のリンク設定に失敗: User update failed'
      )
    })

    it('パートナー側のリンク設定に失敗した場合はロールバックして例外を投げる', async () => {
      const mockUpdate = {
        eq: jest.fn()
          .mockResolvedValueOnce({
            data: null,
            error: null // ユーザー側は成功
          })
          .mockResolvedValueOnce({
            data: null,
            error: { message: 'Partner update failed' } // パートナー側は失敗
          })
          .mockResolvedValueOnce({
            data: null,
            error: null // ロールバックは成功
          })
      }

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue(mockUpdate)
      })

      await expect(PartnerService.linkPartner(mockUserId, mockPartnerId)).rejects.toThrow(
        'パートナー側のリンク設定に失敗: Partner update failed'
      )

      // ロールバックのためのupdate呼び出しが3回行われることを確認
      expect(mockUpdate.eq).toHaveBeenCalledTimes(3)
    })
  })

  describe('unlinkPartner', () => {
    it('正常にパートナーとのリンクを解除できる', async () => {
      // 最初のクエリ: 現在のパートナーIDを取得
      const mockSelect = {
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { partner_id: mockPartnerId },
          error: null
        })
      }

      // 2番目と3番目のクエリ: ユーザーとパートナーのリンクを削除
      const mockUpdate = {
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      }

      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue(mockSelect)
        })
        .mockReturnValue({
          update: jest.fn().mockReturnValue(mockUpdate)
        })

      await expect(PartnerService.unlinkPartner(mockUserId)).resolves.toBeUndefined()

      expect(mockSupabase.from).toHaveBeenCalledTimes(3)
      expect(mockUpdate.eq).toHaveBeenCalledWith('id', mockUserId)
      expect(mockUpdate.eq).toHaveBeenCalledWith('id', mockPartnerId)
    })

    it('プロフィールの取得に失敗した場合は例外を投げる', async () => {
      const mockSelect = {
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Profile not found' }
        })
      }

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue(mockSelect)
      })

      await expect(PartnerService.unlinkPartner(mockUserId)).rejects.toThrow(
        'プロフィールの取得に失敗: Profile not found'
      )
    })

    it('ユーザー側のリンク削除に失敗した場合は例外を投げる', async () => {
      const mockSelect = {
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { partner_id: mockPartnerId },
          error: null
        })
      }

      const mockUpdate = {
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'User unlink failed' }
        })
      }

      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue(mockSelect)
        })
        .mockReturnValue({
          update: jest.fn().mockReturnValue(mockUpdate)
        })

      await expect(PartnerService.unlinkPartner(mockUserId)).rejects.toThrow(
        'ユーザー側のリンク削除に失敗: User unlink failed'
      )
    })

    it('パートナー側のリンク削除に失敗してもユーザー側は削除済みなので続行する', async () => {
      const mockSelect = {
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { partner_id: mockPartnerId },
          error: null
        })
      }

      const mockUpdate = {
        eq: jest.fn()
          .mockResolvedValueOnce({
            data: null,
            error: null // ユーザー側は成功
          })
          .mockResolvedValueOnce({
            data: null,
            error: { message: 'Partner unlink failed' } // パートナー側は失敗
          })
      }

      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue(mockSelect)
        })
        .mockReturnValue({
          update: jest.fn().mockReturnValue(mockUpdate)
        })

      // パートナー側の削除に失敗してもエラーは投げられない
      await expect(PartnerService.unlinkPartner(mockUserId)).resolves.toBeUndefined()

      expect(console.warn).toHaveBeenCalledWith(
        'パートナー側のリンク削除に失敗:',
        { message: 'Partner unlink failed' }
      )
    })
  })

  describe('updateDisplayName', () => {
    const newDisplayName = '新しい表示名'

    it('正常に表示名を更新できる', async () => {
      const updatedProfile = { ...mockProfile, display_name: newDisplayName }
      const mockUpdate = {
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: updatedProfile,
          error: null
        })
      }

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue(mockUpdate)
      })

      const result = await PartnerService.updateDisplayName(mockUserId, newDisplayName)

      expect(result).toEqual(updatedProfile)
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
      expect(mockUpdate.eq).toHaveBeenCalledWith('id', mockUserId)
    })

    it('データベースエラーの場合は例外を投げる', async () => {
      const mockUpdate = {
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Update failed' }
        })
      }

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue(mockUpdate)
      })

      await expect(PartnerService.updateDisplayName(mockUserId, newDisplayName)).rejects.toThrow(
        '表示名の更新に失敗しました: Update failed'
      )
    })
  })

  describe('ensureProfile', () => {
    it('既存のプロフィールがある場合はそれを返す', async () => {
      // getProfileをモック
      jest.spyOn(PartnerService, 'getProfile').mockResolvedValue(mockProfile)

      const result = await PartnerService.ensureProfile(mockUserId, mockEmail)

      expect(result).toEqual(mockProfile)
      expect(PartnerService.getProfile).toHaveBeenCalledWith(mockUserId)
    })

    it('プロフィールが存在しない場合は新しく作成する', async () => {
      const newProfile = { ...mockProfile, display_name: 'test' }

      // getProfileをモック（プロフィールが存在しない）
      jest.spyOn(PartnerService, 'getProfile').mockResolvedValue(null)
      // upsertProfileをモック
      jest.spyOn(PartnerService, 'upsertProfile').mockResolvedValue(newProfile)

      const result = await PartnerService.ensureProfile(mockUserId, mockEmail)

      expect(result).toEqual(newProfile)
      expect(PartnerService.getProfile).toHaveBeenCalledWith(mockUserId)
      expect(PartnerService.upsertProfile).toHaveBeenCalledWith(mockUserId, {
        display_name: 'test'
      })
    })

    it('emailが提供されない場合はデフォルトの表示名を使用する', async () => {
      const newProfile = { ...mockProfile, display_name: 'ユーザー' }

      jest.spyOn(PartnerService, 'getProfile').mockResolvedValue(null)
      jest.spyOn(PartnerService, 'upsertProfile').mockResolvedValue(newProfile)

      const result = await PartnerService.ensureProfile(mockUserId)

      expect(result).toEqual(newProfile)
      expect(PartnerService.upsertProfile).toHaveBeenCalledWith(mockUserId, {
        display_name: 'ユーザー'
      })
    })

    it('無限再帰エラーの場合は適切なエラーメッセージを投げる', async () => {
      jest.spyOn(PartnerService, 'getProfile').mockResolvedValue(null)
      jest.spyOn(PartnerService, 'upsertProfile').mockRejectedValue({
        code: '42P17',
        message: 'infinite recursion detected'
      })

      await expect(PartnerService.ensureProfile(mockUserId, mockEmail)).rejects.toThrow(
        'プロフィールの作成に失敗しました。しばらく待ってから再度お試しください。'
      )

      expect(console.warn).toHaveBeenCalledWith(
        '🔄 RLSポリシーの無限再帰エラーを検出。プロフィール作成をスキップします。'
      )
    })

    it('その他のエラーの場合はそのまま投げる', async () => {
      const error = new Error('Other error')
      jest.spyOn(PartnerService, 'getProfile').mockResolvedValue(null)
      jest.spyOn(PartnerService, 'upsertProfile').mockRejectedValue(error)

      await expect(PartnerService.ensureProfile(mockUserId, mockEmail)).rejects.toThrow(error)
    })
  })

  describe('checkPartnershipStatus', () => {
    it('パートナーがいない場合の状態を返す', async () => {
      jest.spyOn(PartnerService, 'getProfile').mockResolvedValue({
        ...mockProfile,
        partner_id: null
      })

      const result = await PartnerService.checkPartnershipStatus(mockUserId)

      expect(result).toEqual({
        hasPartner: false,
        partnerId: null,
        partnerInfo: null,
        isLinkedProperly: false
      })
    })

    it('正常にリンクされたパートナーがいる場合の状態を返す', async () => {
      jest.spyOn(PartnerService, 'getProfile')
        .mockResolvedValueOnce({
          ...mockProfile,
          partner_id: mockPartnerId
        })
        .mockResolvedValueOnce({
          ...mockPartnerProfile,
          partner_id: mockUserId
        })

      const result = await PartnerService.checkPartnershipStatus(mockUserId)

      expect(result).toEqual({
        hasPartner: true,
        partnerId: mockPartnerId,
        partnerInfo: mockPartnerProfile,
        isLinkedProperly: true
      })
    })

    it('パートナーが存在しない場合の状態を返す', async () => {
      jest.spyOn(PartnerService, 'getProfile')
        .mockResolvedValueOnce({
          ...mockProfile,
          partner_id: mockPartnerId
        })
        .mockResolvedValueOnce(null)

      const result = await PartnerService.checkPartnershipStatus(mockUserId)

      expect(result).toEqual({
        hasPartner: false,
        partnerId: mockPartnerId,
        partnerInfo: null,
        isLinkedProperly: false
      })
    })

    it('リンクが正しく設定されていない場合の状態を返す', async () => {
      const incorrectPartnerProfile = {
        ...mockPartnerProfile,
        partner_id: 'other-user-id' // 異なるユーザーIDにリンクされている
      }

      jest.spyOn(PartnerService, 'getProfile')
        .mockResolvedValueOnce({
          ...mockProfile,
          partner_id: mockPartnerId
        })
        .mockResolvedValueOnce(incorrectPartnerProfile)

      const result = await PartnerService.checkPartnershipStatus(mockUserId)

      expect(result).toEqual({
        hasPartner: true,
        partnerId: mockPartnerId,
        partnerInfo: incorrectPartnerProfile,
        isLinkedProperly: false
      })
    })

    it('エラーが発生した場合は例外を投げる', async () => {
      const error = new Error('Database error')
      jest.spyOn(PartnerService, 'getProfile').mockRejectedValue(error)

      await expect(PartnerService.checkPartnershipStatus(mockUserId)).rejects.toThrow(
        'パートナー関係の状態確認に失敗しました: Database error'
      )
    })
  })
})