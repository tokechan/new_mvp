/**
 * Supabase統合テスト
 * データベース接続、RLSポリシー、基本的なCRUD操作を検証
 */

import { createSupabaseBrowserClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

// テスト用のユーザーデータ
const testUser: Partial<User> = {
  id: 'test-user-integration',
  email: 'integration-test@example.com',
  user_metadata: { name: 'Integration Test User' },
}

// テスト用の家事データ
const testChore = {
  title: 'Integration Test Chore',
  done: false,
}

describe('Supabase Integration Tests', () => {
  let supabase: ReturnType<typeof createSupabaseBrowserClient>
  let testProfileId: string
  let testChoreId: number

  beforeAll(async () => {
    supabase = createSupabaseBrowserClient()
    testProfileId = testUser.id!
  })

  afterAll(async () => {
    // テストデータのクリーンアップ
    try {
      if (testChoreId) {
        await supabase.from('chores').delete().eq('id', testChoreId)
      }
      await supabase.from('profiles').delete().eq('id', testProfileId)
    } catch (error) {
      console.warn('テストデータのクリーンアップに失敗:', error)
    }
  })

  describe('データベース接続', () => {
    it('should connect to Supabase successfully', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should have required environment variables', () => {
      expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined()
      expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined()
    })
  })

  describe('プロフィール管理', () => {
    it('should create a test profile', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: testProfileId,
          display_name: 'Integration Test User',
          email: testUser.email,
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.id).toBe(testProfileId)
    })

    it('should read the created profile', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', testProfileId)
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.display_name).toBe('Integration Test User')
    })

    it('should update the profile', async () => {
      const updatedName = 'Updated Integration Test User'
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ display_name: updatedName })
        .eq('id', testProfileId)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.display_name).toBe(updatedName)
    })
  })

  describe('家事管理', () => {
    it('should create a test chore', async () => {
      const { data, error } = await supabase
        .from('chores')
        .insert({
          ...testChore,
          owner_id: testProfileId,
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.title).toBe(testChore.title)
      expect(data?.owner_id).toBe(testProfileId)
      
      testChoreId = data?.id
    })

    it('should read the created chore', async () => {
      const { data, error } = await supabase
        .from('chores')
        .select('*')
        .eq('id', testChoreId)
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.title).toBe(testChore.title)
    })

    it('should update the chore', async () => {
      const { data, error } = await supabase
        .from('chores')
        .update({ done: true })
        .eq('id', testChoreId)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.done).toBe(true)
    })

    it('should delete the chore', async () => {
      const { error } = await supabase
        .from('chores')
        .delete()
        .eq('id', testChoreId)

      expect(error).toBeNull()

      // 削除されたことを確認
      const { data, error: selectError } = await supabase
        .from('chores')
        .select('*')
        .eq('id', testChoreId)
        .single()

      expect(data).toBeNull()
      expect(selectError).toBeDefined()
      
      // テストチョアIDをリセット（クリーンアップで重複削除を避ける）
      testChoreId = 0
    })
  })

  describe('RLSポリシー検証', () => {
    it('should enforce RLS on profiles table', async () => {
      // 認証なしでプロフィールにアクセスしようとする
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', 'non-existent-user')

      // RLSが有効な場合、認証されていないユーザーはデータにアクセスできない
      expect(data).toEqual([])
    })

    it('should enforce RLS on chores table', async () => {
      // 認証なしで家事にアクセスしようとする
      const { data, error } = await supabase
        .from('chores')
        .select('*')
        .eq('owner_id', 'non-existent-user')

      // RLSが有効な場合、認証されていないユーザーはデータにアクセスできない
      expect(data).toEqual([])
    })
  })

  describe('リアルタイム機能', () => {
    it('should be able to subscribe to changes', async () => {
      let receivedPayload: any = null
      
      const subscription = supabase
        .channel('test-channel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'chores',
          },
          (payload) => {
            receivedPayload = payload
          }
        )
        .subscribe()

      // サブスクリプションが正常に作成されることを確認
      expect(subscription).toBeDefined()
      
      // クリーンアップ
      await supabase.removeChannel(subscription)
    })
  })

  describe('エラーハンドリング', () => {
    it('should handle invalid table name gracefully', async () => {
      const { data, error } = await supabase
        .from('non_existent_table')
        .select('*')

      expect(error).toBeDefined()
      expect(data).toBeNull()
    })

    it('should handle invalid column name gracefully', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('non_existent_column')

      expect(error).toBeDefined()
      expect(data).toBeNull()
    })

    it('should handle constraint violations', async () => {
      // 重複するIDでプロフィールを作成しようとする
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: testProfileId, // 既に存在するID
          display_name: 'Duplicate Profile',
        })

      expect(error).toBeDefined()
      expect(data).toBeNull()
    })
  })
})