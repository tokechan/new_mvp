import {
  createInvitation,
  getInvitations,
  getInvitation,
  acceptInvitation,
  cancelInvitation,
  cleanupExpiredInvitations,
  InvitationService
} from '../invitationService'

// Supabaseクライアントをモック化
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn()
    },
    from: jest.fn(),
    rpc: jest.fn()
  }
}))

import { supabase } from '@/lib/supabase'

// モックされたsupabaseクライアント
const mockSupabase = supabase as any

describe('invitationService', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com'
  }

  const mockInvitation = {
    id: 123,
    inviter_id: 'user-123',
    accepted_by: null,
    accepted_at: null,
    invitee_email: 'invitee@example.com',
    invite_code: 'ABC123',
    status: 'pending',
    created_at: '2024-01-01T00:00:00Z',
    expires_at: '2024-01-08T00:00:00Z'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // コンソールエラーをモック化してテスト出力をクリーンに保つ
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('createInvitation', () => {
    const mockRequest = {
      invitee_email: 'invitee@example.com'
    }

    it('正常に招待を作成できる', async () => {
      // 認証されたユーザーをモック
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // 招待コード生成をモック
      mockSupabase.rpc.mockResolvedValue({
        data: 'ABC123',
        error: null
      })

      // 招待作成をモック
      const mockInsert = {
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockInvitation,
          error: null
        })
      }
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue(mockInsert)
      })

      const result = await createInvitation(mockRequest)

      expect(result.success).toBe(true)
      expect(result.invitation).toEqual(mockInvitation)
      expect(mockSupabase.rpc).toHaveBeenCalledWith('generate_invite_code')
      expect(mockSupabase.from).toHaveBeenCalledWith('partner_invitations')
    })

    it('未認証ユーザーの場合はエラーを返す', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const result = await createInvitation(mockRequest)

      expect(result.success).toBe(false)
      expect(result.error).toBe('ユーザーが認証されていません')
    })

    it('招待コード生成に失敗した場合はエラーを返す', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Code generation failed' }
      })

      const result = await createInvitation(mockRequest)

      expect(result.success).toBe(false)
      expect(result.error).toBe('招待コードの生成に失敗しました')
    })

    it('例外が発生した場合はエラーを返す', async () => {
      mockSupabase.auth.getUser.mockRejectedValue(new Error('Network error'))

      const result = await createInvitation(mockRequest)

      expect(result.success).toBe(false)
      expect(result.error).toBe('招待の作成に失敗しました')
    })
  })

  describe('getInvitations', () => {
    it('正常に招待一覧を取得できる', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const mockSelect = {
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [mockInvitation],
          error: null
        })
      }
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue(mockSelect)
      })

      const result = await getInvitations()

      expect(result.success).toBe(true)
      expect(result.invitations).toEqual([mockInvitation])
      expect(mockSelect.eq).toHaveBeenCalledWith('inviter_id', mockUser.id)
      expect(mockSelect.order).toHaveBeenCalledWith('created_at', { ascending: false })
    })

    it('未認証ユーザーの場合はエラーを返す', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const result = await getInvitations()

      expect(result.success).toBe(false)
      expect(result.error).toBe('ユーザーが認証されていません')
    })

    it('空の配列が返された場合も正常に処理する', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const mockSelect = {
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      }
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue(mockSelect)
      })

      const result = await getInvitations()

      expect(result.success).toBe(true)
      expect(result.invitations).toEqual([])
    })
  })

  describe('getInvitation', () => {
    const inviteCode = 'ABC123'

    it('正常に招待情報を取得できる', async () => {
      const mockSelect = {
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockInvitation,
          error: null
        })
      }
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue(mockSelect)
      })

      const result = await getInvitation(inviteCode)

      expect(result.success).toBe(true)
      expect(result.invitation).toEqual(mockInvitation)
      expect(mockSelect.eq).toHaveBeenCalledWith('invite_code', inviteCode)
    })

    it('招待が見つからない場合はエラーを返す', async () => {
      const mockSelect = {
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' }
        })
      }
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue(mockSelect)
      })

      const result = await getInvitation(inviteCode)

      expect(result.success).toBe(false)
      expect(result.error).toBe('招待が見つかりません')
    })
  })

  describe('acceptInvitation', () => {
    const mockRequest = {
      invite_code: 'ABC123'
    }

    it('正常に招待を受け入れできる', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.rpc.mockResolvedValue({
        data: true,
        error: null
      })

      const result = await acceptInvitation(mockRequest)

      expect(result.success).toBe(true)
      expect(mockSupabase.rpc).toHaveBeenCalledWith('link_partners', {
        p_accepter_id: mockUser.id,
        p_invite_code: mockRequest.invite_code
      })
    })

    it('未認証ユーザーの場合はエラーを返す', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const result = await acceptInvitation(mockRequest)

      expect(result.success).toBe(false)
      expect(result.error).toBe('ユーザーが認証されていません')
    })

    it('無効な招待コードの場合はエラーを返す', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: null
      })

      const result = await acceptInvitation(mockRequest)

      expect(result.success).toBe(false)
      expect(result.error).toBe('無効な招待コードです')
    })
  })

  describe('cancelInvitation', () => {
    const invitationId = '123'

    it('正常に招待をキャンセルできる', async () => {
      const mockUpdate = {
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      }
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue(mockUpdate)
      })

      await expect(cancelInvitation(invitationId)).resolves.toBeUndefined()

      expect(mockSupabase.from).toHaveBeenCalledWith('partner_invitations')
      expect(mockUpdate.eq).toHaveBeenCalledWith('id', invitationId)
    })

    it('データベースエラーの場合は例外を投げる', async () => {
      const mockUpdate = {
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Update failed' }
        })
      }
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue(mockUpdate)
      })

      await expect(cancelInvitation(invitationId)).rejects.toThrow(
        '招待のキャンセルに失敗しました: Update failed'
      )
    })
  })

  describe('cleanupExpiredInvitations', () => {
    it('正常に期限切れ招待を削除できる', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: null
      })

      await expect(cleanupExpiredInvitations()).resolves.toBeUndefined()

      expect(mockSupabase.rpc).toHaveBeenCalledWith('cleanup_expired_invitations')
    })

    it('データベースエラーの場合は例外を投げる', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Cleanup failed' }
      })

      await expect(cleanupExpiredInvitations()).rejects.toThrow(
        '期限切れ招待の削除に失敗しました: Cleanup failed'
      )
    })
  })

  describe('InvitationService クラス', () => {
    it('createInvitation メソッドが正常に動作する', async () => {
      const mockRequest = {
        invitee_email: 'test@example.com'
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.rpc.mockResolvedValue({
        data: 'ABC123',
        error: null
      })

      const mockInsert = {
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockInvitation,
          error: null
        })
      }
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue(mockInsert)
      })

      const result = await InvitationService.createInvitation(mockRequest)

      expect(result.success).toBe(true)
      expect(result.invitation).toEqual(mockInvitation)
    })

    it('getInvitation メソッドが正常に動作する', async () => {
      const inviteCode = 'ABC123'

      const mockSelect = {
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockInvitation,
          error: null
        })
      }
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue(mockSelect)
      })

      const result = await InvitationService.getInvitation(inviteCode)

      expect(result.success).toBe(true)
      expect(result.invitation).toEqual(mockInvitation)
    })
  })
})