// Supabaseクライアントのモック
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}))

import { ChoreService } from '../choreService'
import { supabase } from '@/lib/supabase'

// モックされたsupabaseクライアントの型定義
const mockSupabase = supabase as jest.Mocked<typeof supabase>

describe('ChoreService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getChores', () => {
    /**
     * 家事一覧の取得が正常に動作することを確認
     */
    it('should return chores for a user', async () => {
      const mockChores = [
        { id: 1, title: 'テスト家事1', done: false, owner_id: 'user1' },
        { id: 2, title: 'テスト家事2', done: true, owner_id: 'user1' }
      ]
      
      const mockOrderQuery = {
         order: jest.fn().mockResolvedValue({ data: mockChores, error: null })
       }
       
       const mockOrQuery = {
         or: jest.fn().mockReturnValue(mockOrderQuery)
       }
       
       const mockSelectQuery = {
         or: jest.fn().mockReturnValue(mockOrderQuery)
       }
       
       const mockFromQuery = {
         select: jest.fn().mockReturnValue(mockSelectQuery)
       }
       
       mockSupabase.from.mockReturnValue(mockFromQuery as any)
      
      const result = await ChoreService.getChores('user1')
      
      expect(mockSupabase.from).toHaveBeenCalledWith('chores')
      expect(result).toEqual(mockChores)
    })

    /**
     * データベースエラー時の例外処理を確認
     */
    it('should throw error when database error occurs', async () => {
      const mockError = { message: 'Database error' }
      
      const mockErrorOrderQuery = {
         order: jest.fn().mockResolvedValue({ data: null, error: mockError })
       }
       
       const mockErrorSelectQuery = {
         or: jest.fn().mockReturnValue(mockErrorOrderQuery)
       }
       
       const mockErrorFromQuery = {
         select: jest.fn().mockReturnValue(mockErrorSelectQuery)
       }
       
       mockSupabase.from.mockReturnValue(mockErrorFromQuery as any)
      
      await expect(ChoreService.getChores('user1')).rejects.toThrow('Database error')
    })
  })

  describe('createChore', () => {
    /**
     * 新しい家事の作成が正常に動作することを確認
     */
    it('should create a new chore', async () => {
      const newChore = {
        title: 'テスト家事',
        description: 'テスト説明',
        owner_id: 'user1'
      }
      const mockResponse = { id: 1, ...newChore, done: false, created_at: '2024-01-01' }
      
      const mockSingleQuery = {
         single: jest.fn().mockResolvedValue({ data: mockResponse, error: null })
       }
       
       const mockSelectQuery = {
         select: jest.fn().mockReturnValue(mockSingleQuery)
       }
       
       const mockInsertQuery = {
         select: jest.fn().mockReturnValue(mockSingleQuery)
       }
       
       const mockCreateFromQuery = {
         insert: jest.fn().mockReturnValue(mockInsertQuery)
       }
       
       mockSupabase.from.mockReturnValue(mockCreateFromQuery as any)
      
      const result = await ChoreService.createChore(newChore)
      
      expect(mockSupabase.from).toHaveBeenCalledWith('chores')
      expect(result).toEqual(mockResponse)
    })
  })

  describe('updateChore', () => {
    /**
     * 家事の更新が正常に動作することを確認
     */
    it('should update a chore', async () => {
      const updatedChore = { id: 1, title: 'テスト家事', done: true, owner_id: 'user1' }
      
      const mockUpdateSelectQuery = {
        single: jest.fn().mockResolvedValue({ data: updatedChore, error: null })
      }
      
      const mockUpdateEqQuery = {
        select: jest.fn().mockReturnValue(mockUpdateSelectQuery)
      }
      
      const mockUpdateQuery = {
        eq: jest.fn().mockReturnValue(mockUpdateEqQuery)
      }
      
      const mockUpdateFromQuery = {
        update: jest.fn().mockReturnValue(mockUpdateQuery)
      }
      
      mockSupabase.from.mockReturnValue(mockUpdateFromQuery as any)
      
      const result = await ChoreService.updateChore(1, { done: true })
      
      expect(mockSupabase.from).toHaveBeenCalledWith('chores')
      expect(result).toEqual(updatedChore)
    })

    /**
     * 存在しない家事の更新時のエラーハンドリングを確認
     */
    it('should throw error when chore not found', async () => {
      const mockError = { message: 'Chore not found' }
      
      const mockUpdateErrorSelectQuery = {
        single: jest.fn().mockResolvedValue({ data: null, error: mockError })
      }
      
      const mockUpdateErrorEqQuery = {
        select: jest.fn().mockReturnValue(mockUpdateErrorSelectQuery)
      }
      
      const mockUpdateErrorQuery = {
        eq: jest.fn().mockReturnValue(mockUpdateErrorEqQuery)
      }
      
      const mockUpdateErrorFromQuery = {
        update: jest.fn().mockReturnValue(mockUpdateErrorQuery)
      }
      
      mockSupabase.from.mockReturnValue(mockUpdateErrorFromQuery as any)
      
      await expect(ChoreService.updateChore(999, { done: true })).rejects.toThrow('Chore not found')
    })
  })

  describe('deleteChore', () => {
    /**
     * 家事の削除が正常に動作することを確認
     */
    it('should delete a chore', async () => {
      const mockDeleteEqQuery = {
        eq: jest.fn().mockResolvedValue({ data: null, error: null })
      }
      
      const mockDeleteFromQuery = {
        delete: jest.fn().mockReturnValue(mockDeleteEqQuery)
      }
      
      mockSupabase.from.mockReturnValue(mockDeleteFromQuery as any)
      
      await ChoreService.deleteChore(1)
      
      expect(mockSupabase.from).toHaveBeenCalledWith('chores')
    })

    /**
     * 削除失敗時のエラーハンドリングを確認
     */
    it('should throw error when deletion fails', async () => {
      const mockError = { message: 'Deletion failed' }
      
      const mockDeleteErrorEqQuery = {
        eq: jest.fn().mockResolvedValue({ data: null, error: mockError })
      }
      
      const mockDeleteErrorFromQuery = {
        delete: jest.fn().mockReturnValue(mockDeleteErrorEqQuery)
      }
      
      mockSupabase.from.mockReturnValue(mockDeleteErrorFromQuery as any)
      
      await expect(ChoreService.deleteChore(1)).rejects.toThrow('Deletion failed')
    })
  })
})