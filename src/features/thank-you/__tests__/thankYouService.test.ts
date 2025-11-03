import {
  sendThankYou,
  sendThankYouForChore,
  getThankYouHistory,
  getThankYouStats,
  PREDEFINED_THANK_YOU_MESSAGES,
  type ThankYouMessage,
  type PredefinedThankYouMessage
} from '@/features/thank-you/services/thankYouService'
import { supabase } from '@/lib/supabase'

// Supabaseクライアントのモック
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}))

const mockSupabase = supabase as any

describe('thankYouService', () => {
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000'
  const mockPartnerId = '987fcdeb-51a2-43d1-b789-123456789abc'
  const mockChoreId = 1
  const mockCompletionId = 1

  const mockThankYouMessage: ThankYouMessage = {
    id: 1,
    from_id: mockUserId,
    to_id: mockPartnerId,
    message: 'ありがとう！',
    chore_id: null,
    created_at: '2024-01-01T00:00:00Z',
    from_user: {
      display_name: 'テストユーザー'
    },
    to_user: {
      display_name: 'パートナー'
    }
  }

  const mockChoreCompletion = {
    id: mockCompletionId,
    user_id: mockPartnerId,
    chore_id: mockChoreId,
    completed_at: '2024-01-01T00:00:00Z',
    chore: {
      id: mockChoreId,
      title: 'テスト家事',
      owner_id: mockUserId,
      partner_id: mockPartnerId
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('sendThankYou', () => {
    it('感謝メッセージを正常に送信できる', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockThankYouMessage,
            error: null
          })
        })
      })

      mockSupabase.from.mockReturnValue({
        insert: mockInsert
      })

      const input = {
        toUserId: mockPartnerId,
        message: 'ありがとう！'
      }

      const result = await sendThankYou(mockUserId, input)

      expect(mockSupabase.from).toHaveBeenCalledWith('thanks')
      expect(mockInsert).toHaveBeenCalledWith({
        from_id: mockUserId,
        to_id: mockPartnerId,
        message: 'ありがとう！',
        created_at: expect.any(String)
      })
      expect(result).toEqual(mockThankYouMessage)
    })

    it('家事IDを含む感謝メッセージを送信できる', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { ...mockThankYouMessage, chore_id: mockChoreId },
            error: null
          })
        })
      })

      mockSupabase.from.mockReturnValue({
        insert: mockInsert
      })

      const input = {
        toUserId: mockPartnerId,
        choreId: mockChoreId,
        message: 'お疲れさまでした！'
      }

      const result = await sendThankYou(mockUserId, input)

      expect(mockInsert).toHaveBeenCalledWith({
        from_id: mockUserId,
        to_id: mockPartnerId,
        message: 'お疲れさまでした！',
        created_at: expect.any(String)
      })
      expect(result.chore_id).toBe(mockChoreId)
    })

    it('無効な入力でバリデーションエラーが発生する', async () => {
      const input = {
        toUserId: 'invalid-uuid',
        message: ''
      }

      await expect(sendThankYou(mockUserId, input)).rejects.toThrow()
    })

    it('メッセージが500文字を超える場合にバリデーションエラーが発生する', async () => {
      const input = {
        toUserId: mockPartnerId,
        message: 'a'.repeat(501)
      }

      await expect(sendThankYou(mockUserId, input)).rejects.toThrow()
    })

    it('データベースエラーが発生した場合にエラーをスローする', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' }
          })
        })
      })

      mockSupabase.from.mockReturnValue({
        insert: mockInsert
      })

      const input = {
        toUserId: mockPartnerId,
        message: 'ありがとう！'
      }

      await expect(sendThankYou(mockUserId, input)).rejects.toThrow('感謝メッセージの送信に失敗しました: Database error')
    })
  })

  describe('sendThankYouForChore', () => {
    it('家事完了に対する感謝メッセージを正常に送信できる', async () => {
      // 家事完了情報の取得をモック
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockChoreCompletion,
            error: null
          })
        })
      })

      // 感謝メッセージの挿入をモック
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { ...mockThankYouMessage, chore_id: mockChoreId },
            error: null
          })
        })
      })

      mockSupabase.from
        .mockReturnValueOnce({ select: mockSelect }) // completions
        .mockReturnValueOnce({ insert: mockInsert }) // thanks

      const input = {
        toUserId: mockPartnerId, // 実際には関数内で上書きされるが、型の要件として必要
        message: 'お疲れさまでした！'
      }

      const result = await sendThankYouForChore(mockUserId, mockCompletionId, input)

      expect(mockSupabase.from).toHaveBeenCalledWith('completions')
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('chore:chores'))
      expect(result.chore_id).toBe(mockChoreId)
    })

    it('家事完了情報が見つからない場合にエラーをスローする', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Not found' }
          })
        })
      })

      mockSupabase.from.mockReturnValue({ select: mockSelect })

      const input = {
        toUserId: mockPartnerId,
        message: 'お疲れさまでした！'
      }

      await expect(sendThankYouForChore(mockUserId, mockCompletionId, input))
        .rejects.toThrow('家事完了情報が見つかりません')
    })

    it('権限がない場合にエラーをスローする', async () => {
      const unauthorizedCompletion = {
        ...mockChoreCompletion,
        chore: {
          ...mockChoreCompletion.chore,
          owner_id: 'other-user',
          partner_id: 'another-user'
        }
      }

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: unauthorizedCompletion,
            error: null
          })
        })
      })

      mockSupabase.from.mockReturnValue({ select: mockSelect })

      const input = {
        toUserId: mockPartnerId,
        message: 'お疲れさまでした！'
      }

      await expect(sendThankYouForChore(mockUserId, mockCompletionId, input))
        .rejects.toThrow('この家事に対する感謝メッセージを送信する権限がありません')
    })
  })

  describe('getThankYouHistory', () => {
    const mockHistory = [
      mockThankYouMessage,
      {
        ...mockThankYouMessage,
        id: 2,
        message: '助かりました！'
      }
    ]

    it('全ての感謝メッセージ履歴を取得できる', async () => {
      const mockRange = jest.fn().mockResolvedValue({
        data: mockHistory,
        error: null
      })

      const mockOrder = jest.fn().mockReturnValue({
        range: mockRange
      })

      const mockOr = jest.fn().mockReturnValue({
        order: mockOrder
      })

      const mockSelect = jest.fn().mockReturnValue({
        or: mockOr
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      })

      const result = await getThankYouHistory(mockUserId)

      expect(mockSupabase.from).toHaveBeenCalledWith('thanks')
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('from_user:profiles'))
      expect(mockOr).toHaveBeenCalledWith(`from_id.eq.${mockUserId},to_id.eq.${mockUserId}`)
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(mockRange).toHaveBeenCalledWith(0, 49)
      expect(result).toEqual(mockHistory)
    })

    it('送信した感謝メッセージのみを取得できる', async () => {
      const mockRange = jest.fn().mockResolvedValue({
        data: mockHistory,
        error: null
      })

      const mockOrder = jest.fn().mockReturnValue({
        range: mockRange
      })

      const mockEq = jest.fn().mockReturnValue({
        order: mockOrder
      })

      const mockSelect = jest.fn().mockReturnValue({
        eq: mockEq
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      })

      const result = await getThankYouHistory(mockUserId, { type: 'sent' })

      expect(mockEq).toHaveBeenCalledWith('from_id', mockUserId)
      expect(result).toEqual(mockHistory)
    })

    it('受信した感謝メッセージのみを取得できる', async () => {
      const mockRange = jest.fn().mockResolvedValue({
        data: mockHistory,
        error: null
      })

      const mockOrder = jest.fn().mockReturnValue({
        range: mockRange
      })

      const mockEq = jest.fn().mockReturnValue({
        order: mockOrder
      })

      const mockSelect = jest.fn().mockReturnValue({
        eq: mockEq
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      })

      const result = await getThankYouHistory(mockUserId, { type: 'received' })

      expect(mockEq).toHaveBeenCalledWith('to_id', mockUserId)
      expect(result).toEqual(mockHistory)
    })

    it('カスタムlimitとoffsetで取得できる', async () => {
      const mockRange = jest.fn().mockResolvedValue({
        data: mockHistory,
        error: null
      })

      const mockOrder = jest.fn().mockReturnValue({
        range: mockRange
      })

      const mockOr = jest.fn().mockReturnValue({
        order: mockOrder
      })

      const mockSelect = jest.fn().mockReturnValue({
        or: mockOr
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      })

      await getThankYouHistory(mockUserId, { limit: 10, offset: 5 })

      expect(mockRange).toHaveBeenCalledWith(5, 14)
    })

    it('データベースエラーが発生した場合にエラーをスローする', async () => {
      const mockRange = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })

      const mockOrder = jest.fn().mockReturnValue({
        range: mockRange
      })

      const mockOr = jest.fn().mockReturnValue({
        order: mockOrder
      })

      const mockSelect = jest.fn().mockReturnValue({
        or: mockOr
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      })

      await expect(getThankYouHistory(mockUserId))
        .rejects.toThrow('感謝メッセージ履歴の取得に失敗しました: Database error')
    })
  })

  describe('getThankYouStats', () => {
    it('感謝メッセージの統計情報を正常に取得できる', async () => {
      const mockSentSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          count: 5,
          error: null
        })
      })

      const mockReceivedSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          count: 3,
          error: null
        })
      })

      mockSupabase.from
        .mockReturnValueOnce({ select: mockSentSelect })
        .mockReturnValueOnce({ select: mockReceivedSelect })

      const result = await getThankYouStats(mockUserId)

      expect(mockSupabase.from).toHaveBeenCalledWith('thanks')
      expect(result).toEqual({
        sentCount: 5,
        receivedCount: 3,
        totalCount: 8
      })
    })

    it('送信済みメッセージ数の取得でエラーが発生した場合にエラーをスローする', async () => {
      const mockSentSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          count: null,
          error: { message: 'Database error' }
        })
      })

      mockSupabase.from.mockReturnValue({ select: mockSentSelect })

      await expect(getThankYouStats(mockUserId))
        .rejects.toThrow('統計情報の取得に失敗しました')
    })

    it('受信済みメッセージ数の取得でエラーが発生した場合にエラーをスローする', async () => {
      const mockSentSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          count: 5,
          error: null
        })
      })

      const mockReceivedSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          count: null,
          error: { message: 'Database error' }
        })
      })

      mockSupabase.from
        .mockReturnValueOnce({ select: mockSentSelect })
        .mockReturnValueOnce({ select: mockReceivedSelect })

      await expect(getThankYouStats(mockUserId))
        .rejects.toThrow('統計情報の取得に失敗しました')
    })

    it('カウントがnullの場合に0として扱う', async () => {
      const mockSentSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          count: null,
          error: null
        })
      })

      const mockReceivedSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          count: null,
          error: null
        })
      })

      mockSupabase.from
        .mockReturnValueOnce({ select: mockSentSelect })
        .mockReturnValueOnce({ select: mockReceivedSelect })

      const result = await getThankYouStats(mockUserId)

      expect(result).toEqual({
        sentCount: 0,
        receivedCount: 0,
        totalCount: 0
      })
    })
  })

  describe('PREDEFINED_THANK_YOU_MESSAGES', () => {
    it('定型感謝メッセージが正しく定義されている', () => {
      expect(PREDEFINED_THANK_YOU_MESSAGES).toHaveLength(5)
      expect(PREDEFINED_THANK_YOU_MESSAGES).toContain('ありがとう！助かりました 😊')
      expect(PREDEFINED_THANK_YOU_MESSAGES).toContain('お疲れさまでした！')
      expect(PREDEFINED_THANK_YOU_MESSAGES).toContain('いつもありがとう ❤️')
      expect(PREDEFINED_THANK_YOU_MESSAGES).toContain('とても助かります！')
      expect(PREDEFINED_THANK_YOU_MESSAGES).toContain('ありがとう！愛してる 💕')
    })

    it('PredefinedThankYouMessage型が正しく動作する', () => {
      const message: PredefinedThankYouMessage = 'ありがとう！助かりました 😊'
      expect(PREDEFINED_THANK_YOU_MESSAGES).toContain(message)
    })
  })
})