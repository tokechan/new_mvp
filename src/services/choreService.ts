'use client'

import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase'

// 型定義
type Chore = Database['public']['Tables']['chores']['Row']
type ChoreInsert = Database['public']['Tables']['chores']['Insert']
type ChoreUpdate = Database['public']['Tables']['chores']['Update']
type Completion = Database['public']['Tables']['completions']['Row']

// 拡張された家事型（完了記録を含む）
export interface ExtendedChore extends Chore {
  completions?: Completion[]
}

/**
 * 家事データアクセス層
 * Supabaseとの通信を抽象化し、将来のBFF移行を容易にする
 */
export class ChoreService {
  /**
   * ユーザーに関連する家事一覧を取得
   */
  static async getChores(userId: string): Promise<ExtendedChore[]> {
    const { data, error } = await supabase
      .from('chores')
      .select(`
        *,
        completions (*)
      `)
      .or(`owner_id.eq.${userId},partner_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('家事の取得に失敗:', error)
      throw new Error(`家事の取得に失敗しました: ${error.message}`)
    }

    return data || []
  }

  /**
   * 新しい家事を作成
   */
  static async createChore(choreData: ChoreInsert): Promise<ExtendedChore> {
    const { data, error } = await supabase
      .from('chores')
      .insert([choreData])
      .select(`
        *,
        completions (*)
      `)
      .single()

    if (error) {
      console.error('家事の作成に失敗:', error)
      throw new Error(`家事の作成に失敗しました: ${error.message}`)
    }

    return data as ExtendedChore
  }

  /**
   * 家事を更新
   */
  static async updateChore(choreId: number, updates: ChoreUpdate): Promise<ExtendedChore> {
    const { data, error } = await supabase
      .from('chores')
      .update(updates)
      .eq('id', choreId)
      .select(`
        *,
        completions (*)
      `)
      .single()

    if (error) {
      console.error('家事の更新に失敗:', error)
      throw new Error(`家事の更新に失敗しました: ${error.message}`)
    }

    return data as ExtendedChore
  }

  /**
   * 家事を削除
   */
  static async deleteChore(choreId: number): Promise<void> {
    const { error } = await supabase
      .from('chores')
      .delete()
      .eq('id', choreId)

    if (error) {
      console.error('家事の削除に失敗:', error)
      throw new Error(`家事の削除に失敗しました: ${error.message}`)
    }
  }

  /**
   * 家事の完了状態を切り替え
   */
  static async toggleChoreCompletion(
    choreId: number, 
    userId: string, 
    completed: boolean
  ): Promise<ExtendedChore> {
    // トランザクション的な処理のため、複数のステップを実行
    try {
      // 1. 家事の完了状態を更新
      const { error: choreError } = await supabase
        .from('chores')
        .update({ done: completed })
        .eq('id', choreId)

      if (choreError) {
        throw new Error(`家事の状態更新に失敗: ${choreError.message}`)
      }

      // 2. 完了記録の管理
      if (completed) {
        // 完了記録を作成
        const { error: completionError } = await supabase
          .from('completions')
          .insert([{
            chore_id: choreId,
            user_id: userId
          }])

        if (completionError) {
          // ロールバック: 家事の状態を元に戻す
          await supabase
            .from('chores')
            .update({ done: false })
            .eq('id', choreId)
          
          throw new Error(`完了記録の作成に失敗: ${completionError.message}`)
        }
      } else {
        // 完了記録を削除
        const { error: deleteError } = await supabase
          .from('completions')
          .delete()
          .eq('chore_id', choreId)
          .eq('user_id', userId)

        if (deleteError) {
          // ロールバック: 家事の状態を元に戻す
          await supabase
            .from('chores')
            .update({ done: true })
            .eq('id', choreId)
          
          throw new Error(`完了記録の削除に失敗: ${deleteError.message}`)
        }
      }

      // 3. 更新された家事データを取得して返す
      const { data, error } = await supabase
        .from('chores')
        .select(`
          *,
          completions (*)
        `)
        .eq('id', choreId)
        .single()

      if (error) {
        throw new Error(`更新後のデータ取得に失敗: ${error.message}`)
      }

      return data as ExtendedChore
    } catch (error) {
      console.error('家事の完了状態切り替えに失敗:', error)
      throw error
    }
  }

  /**
   * 特定の家事の詳細を取得
   */
  static async getChoreById(choreId: number): Promise<ExtendedChore | null> {
    const { data, error } = await supabase
      .from('chores')
      .select(`
        *,
        completions (*)
      `)
      .eq('id', choreId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // 見つからない場合
      }
      console.error('家事の取得に失敗:', error)
      throw new Error(`家事の取得に失敗しました: ${error.message}`)
    }

    return data as ExtendedChore
  }

  /**
   * ユーザーの完了した家事一覧を取得
   */
  static async getCompletedChores(userId: string, limit?: number): Promise<ExtendedChore[]> {
    let query = supabase
      .from('chores')
      .select(`
        *,
        completions (*)
      `)
      .or(`owner_id.eq.${userId},partner_id.eq.${userId}`)
      .eq('done', true)
      .order('updated_at', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('完了した家事の取得に失敗:', error)
      throw new Error(`完了した家事の取得に失敗しました: ${error.message}`)
    }

    return data || []
  }

  /**
   * ユーザーの未完了家事一覧を取得
   */
  static async getPendingChores(userId: string): Promise<ExtendedChore[]> {
    const { data, error } = await supabase
      .from('chores')
      .select(`
        *,
        completions (*)
      `)
      .or(`owner_id.eq.${userId},partner_id.eq.${userId}`)
      .eq('done', false)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('未完了家事の取得に失敗:', error)
      throw new Error(`未完了家事の取得に失敗しました: ${error.message}`)
    }

    return data || []
  }

  /**
   * 家事の統計情報を取得
   */
  static async getChoreStats(userId: string): Promise<{
    total: number
    completed: number
    pending: number
    completionRate: number
  }> {
    const { data, error } = await supabase
      .from('chores')
      .select('id, done')
      .or(`owner_id.eq.${userId},partner_id.eq.${userId}`)

    if (error) {
      console.error('家事統計の取得に失敗:', error)
      throw new Error(`家事統計の取得に失敗しました: ${error.message}`)
    }

    const total = data?.length || 0
    const completed = data?.filter(chore => chore.done).length || 0
    const pending = total - completed
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    return {
      total,
      completed,
      pending,
      completionRate
    }
  }
}