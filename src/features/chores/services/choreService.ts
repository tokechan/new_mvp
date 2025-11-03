'use client'

import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase'
import { shouldUseClientMockAuth } from '@/utils/authMode'

// 型定義
type Chore = Database['public']['Tables']['chores']['Row']
type ChoreInsert = Database['public']['Tables']['chores']['Insert']
type ChoreUpdate = Database['public']['Tables']['chores']['Update']
type Completion = Database['public']['Tables']['completions']['Row']

// 拡張された家事型（完了記録を含む）
export interface ExtendedChore extends Chore {
  completions?: Completion[]
}

export class ChoreLimitReachedError extends Error {
  code: 'CHORE_LIMIT_REACHED' = 'CHORE_LIMIT_REACHED'

  constructor(
    message = '家事の登録上限に達しました。既存の家事を整理するか、上限プランをご検討ください。'
  ) {
    super(message)
    this.name = 'ChoreLimitReachedError'
  }
}

// E2E/開発高速化モード用のローカルストレージフォールバック
const LOCAL_CHORES_KEY = '__e2e_chores'
const isSkipAuth = () => shouldUseClientMockAuth()
const readLocalChores = (): ExtendedChore[] => {
  try {
    if (typeof window === 'undefined') return []
    const raw = window.localStorage.getItem(LOCAL_CHORES_KEY)
    return raw ? (JSON.parse(raw) as ExtendedChore[]) : []
  } catch {
    return []
  }
}
const writeLocalChores = (list: ExtendedChore[]) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(LOCAL_CHORES_KEY, JSON.stringify(list))
}
const upsertLocalChore = (chore: ExtendedChore) => {
  const list = readLocalChores()
  const idx = list.findIndex((c) => c.id === chore.id)
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...chore }
  } else {
    list.unshift(chore)
  }
  writeLocalChores(list)
}
const removeLocalChore = (choreId: number) => {
  writeLocalChores(readLocalChores().filter((c) => c.id !== choreId))
}
const updateLocalDone = (choreId: number, userId: string, done: boolean): ExtendedChore | null => {
  const list = readLocalChores()
  const idx = list.findIndex((c) => c.id === choreId)
  if (idx < 0) return null
  const existing = list[idx]
  let completions = existing.completions || []
  if (done) {
    const hasUserRecord = completions.some((c) => c.user_id === userId)
    if (!hasUserRecord) {
      completions = [
        ...completions,
        { id: Date.now(), chore_id: choreId, user_id: userId, created_at: new Date().toISOString() } as any,
      ]
    }
  } else {
    completions = completions.filter((c) => c.user_id !== userId)
  }
  const updated: ExtendedChore = { ...existing, done, completions }
  list[idx] = updated
  writeLocalChores(list)
  return updated
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
        completions (
          id,
          chore_id,
          user_id,
          created_at
        )
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
    // デバッグ: 認証状態とデータを確認
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('🔍 [ChoreService.createChore] 認証状態確認:', {
      hasSession: !!session,
      userId: session?.user?.id,
      sessionError,
      choreData,
      timestamp: new Date().toISOString(),
    })

    const { data, error } = await supabase
      .from('chores')
      .insert([choreData])
      .select(`
        *,
        completions (*)
      `)
      .single()

    if (error) {
      const commonLogPayload = {
        error,
        errorCode: error.code,
        errorMessage: error.message,
        errorDetails: error.details,
        errorHint: error.hint,
        choreData,
        userId: session?.user?.id,
        timestamp: new Date().toISOString(),
      }

      if (error.message === 'chore_limit_exceeded') {
        console.warn('⚠️ [ChoreService.createChore] 家事登録上限に到達:', commonLogPayload)
        throw new ChoreLimitReachedError()
      }

      console.error('🚨 [ChoreService.createChore] 家事の作成に失敗:', commonLogPayload)
      throw new Error(`家事の作成に失敗しました: ${error.message}`)
    }

    console.log('✅ [ChoreService.createChore] 家事作成成功:', {
      choreId: data.id,
      title: data.title,
      ownerId: data.owner_id,
      partnerId: data.partner_id,
      timestamp: new Date().toISOString(),
    })

    // ローカルストレージへ反映（E2E/開発高速化モード）
    if (isSkipAuth()) {
      upsertLocalChore(data as ExtendedChore)
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
    // デバッグ: 認証状態を確認
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('🔍 [ChoreService.deleteChore] 認証状態確認:', {
      hasSession: !!session,
      userId: session?.user?.id,
      choreId,
      sessionError,
      timestamp: new Date().toISOString(),
    })

    const { error } = await supabase
      .from('chores')
      .delete()
      .eq('id', choreId)

    if (error) {
      console.error('🚨 [ChoreService.deleteChore] 家事の削除に失敗:', {
        error,
        errorCode: error.code,
        errorMessage: error.message,
        errorDetails: error.details,
        errorHint: error.hint,
        choreId,
        userId: session?.user?.id,
        timestamp: new Date().toISOString(),
      })
      throw new Error(`家事の削除に失敗しました: ${error.message}`)
    }

    console.log('✅ [ChoreService.deleteChore] 家事削除成功:', {
      choreId,
      userId: session?.user?.id,
      timestamp: new Date().toISOString(),
    })

    // ローカルストレージから削除（E2E/開発高速化モード）
    if (isSkipAuth()) {
      removeLocalChore(choreId)
    }
  }

  /**
   * 家事の完了状態を切り替え
   */
  static async toggleChoreCompletion(
    choreId: number,
    userId: string,
    completed: boolean,
  ): Promise<ExtendedChore> {
    // デバッグ: 認証状態と操作内容を確認
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('🔍 [ChoreService.toggleChoreCompletion] 認証状態確認:', {
      hasSession: !!session,
      sessionUserId: session?.user?.id,
      requestUserId: userId,
      userIdMatch: session?.user?.id === userId,
      choreId,
      completed,
      sessionError,
      timestamp: new Date().toISOString(),
    })

    // トランザクション的な処理のため、複数のステップを実行
    try {
      // 1. 家事の完了状態を更新
      const { error: choreError } = await supabase
        .from('chores')
        .update({ done: completed })
        .eq('id', choreId)

      if (choreError) {
        console.error('🚨 [ChoreService.toggleChoreCompletion] 家事状態更新失敗:', {
          choreError,
          errorCode: choreError.code,
          errorMessage: choreError.message,
          errorDetails: choreError.details,
          errorHint: choreError.hint,
          choreId,
          userId,
          completed,
          timestamp: new Date().toISOString(),
        })
        throw new Error(`家事の状態更新に失敗: ${choreError.message}`)
      }

      // 2. 完了記録の管理
      if (completed) {
        // 完了記録の重複を事前に確認し、存在しなければ挿入
        const { data: existing, error: checkError } = await supabase
          .from('completions')
          .select('id')
          .eq('chore_id', choreId)
          .eq('user_id', userId)
          .limit(1)

        if (checkError) {
          console.error('🚨 [ChoreService.toggleChoreCompletion] 完了記録の存在確認に失敗:', {
            checkError,
            errorCode: checkError.code,
            errorMessage: checkError.message,
            errorDetails: checkError.details,
            errorHint: checkError.hint,
            choreId,
            userId,
            timestamp: new Date().toISOString(),
          })
          // 確認に失敗した場合は安全側に倒して挿入を試みる
        }

        if (!existing || existing.length === 0) {
          const { error: insertError } = await supabase
            .from('completions')
            .insert([{ chore_id: choreId, user_id: userId }])

          if (insertError) {
            console.error('🚨 [ChoreService.toggleChoreCompletion] 完了記録作成失敗 (ソフトエラー継続):', {
              insertError,
              errorCode: insertError.code,
              errorMessage: insertError.message,
              errorDetails: insertError.details,
              errorHint: insertError.hint,
              choreId,
              userId,
              timestamp: new Date().toISOString(),
            })

            // ここではロールバックせず、家事の更新成功を優先して続行
          }
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

      // 3. 更新された家事データを取得して返す（完了記録のメタデータも含める）
      const { data, error } = await supabase
        .from('chores')
        .select(`
          *,
          completions (
            id,
            chore_id,
            user_id,
            created_at
          )
        `)
        .eq('id', choreId)
        .single()

      if (error) {
        throw new Error(`更新後のデータ取得に失敗: ${error.message}`)
      }

      // ローカルストレージへ反映（E2E/開発高速化モード）
      if (isSkipAuth()) {
        updateLocalDone(choreId, userId, completed)
      }

      return data as ExtendedChore
    } catch (error) {
      // 例外内容をわかりやすく出力
      console.error('家事の完了状態切り替えに失敗:', {
        message: (error as any)?.message || String(error),
        name: (error as any)?.name,
        stack: (error as any)?.stack,
      })

      // 認証スキップ時はローカルストレージに反映して擬似的に成功させる
      if (isSkipAuth()) {
        const localUpdated = updateLocalDone(choreId, userId, completed)
        if (localUpdated) {
          return localUpdated
        }
      }

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
    // 認証スキップ時はローカルストレージから取得
    if (isSkipAuth()) {
      let list = readLocalChores().filter((c) => c.done && (c.owner_id === userId || c.partner_id === userId))
      if (limit) list = list.slice(0, limit)
      return list
    }

    let query = supabase
      .from('chores')
      .select(`
        *,
        completions (*)
      `)
      .or(`owner_id.eq.${userId},partner_id.eq.${userId}`)
      .eq('done', true)
      .order('created_at', { ascending: false })

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
    const completed = data?.filter((chore) => chore.done).length || 0
    const pending = total - completed
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    return {
      total,
      completed,
      pending,
      completionRate,
    }
  }
}
