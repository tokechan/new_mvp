'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

// 新しいデータベーススキーマに対応した型定義
type Chore = {
  id: number
  owner_id: string
  partner_id: string | null
  title: string
  done: boolean
  created_at: string
}

type ChoreInsert = {
  owner_id: string
  partner_id?: string | null
  title: string
  done?: boolean
}

export default function ChoresList() {
  const { user } = useAuth()
  const [chores, setChores] = useState<Chore[]>([])
  const [loading, setLoading] = useState(true)
  const [newChore, setNewChore] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  /**
   * 自分がownerまたはpartnerの家事を取得する。
   * RLSにより他ユーザーのデータは除外される。
   */
  const fetchChores = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('chores')
        .select('*')
        .or(`owner_id.eq.${user.id},partner_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (error) throw error
      setChores(data || [])
    } catch (error) {
      console.error('家事の取得に失敗しました:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * プロフィールが存在しない場合は作成する（RLSの前提を満たすため）。
   * - 一部のRLSポリシーで profiles.id = auth.uid() の存在を前提とすることがある。
   */
  const ensureOwnProfile = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()
      if (error && error.code !== 'PGRST116') throw error // PGRST116: No rows found for single() 相当
      if (!data) {
        const displayName = user.email?.split('@')[0] || 'ユーザー'
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({ id: user.id, display_name: displayName })
        if (upsertError) throw upsertError
      }
    } catch (e) {
      console.warn('プロフィール確認/作成に失敗しました:', e)
    }
  }

  // 新しい家事を追加
  const addChore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newChore.trim()) return

    setIsAdding(true)
    try {
      // RLS要件を満たすためプロフィールの存在を保証
      await ensureOwnProfile()

      const choreData: ChoreInsert = {
        title: newChore.trim(),
        owner_id: user.id,
        partner_id: null, // 後でパートナー設定機能を追加予定
        done: false
      }

      const { data, error } = await supabase
        .from('chores')
        .insert([choreData])
        .select()
        .single()

      if (error) throw error

      setChores([data as Chore, ...chores])
      setNewChore('')
    } catch (error: any) {
      console.error('家事の追加に失敗しました:', error)
      alert('家事の追加に失敗しました。ログイン状態やプロフィールの作成状況を確認してください。')
    } finally {
      setIsAdding(false)
    }
  }

  /**
   * 家事の完了状態を切り替える。完了に変更された場合はcompletionsへ記録。
   */
  const toggleChore = async (choreId: number, currentDone: boolean) => {
    try {
      const newDone = !currentDone
      const { error } = await supabase
        .from('chores')
        .update({ done: newDone })
        .eq('id', choreId)

      if (error) throw error

      // 完了時にcompletionsテーブルにレコードを追加
      if (newDone && user) {
        const { error: completionError } = await supabase
          .from('completions')
          .insert({
            chore_id: choreId,
            user_id: user.id
          })
        
        if (completionError) {
          console.error('完了記録の追加に失敗しました:', completionError)
        }
      }

      setChores(chores.map(chore => 
        chore.id === choreId 
          ? { ...chore, done: newDone }
          : chore
      ))
    } catch (error) {
      console.error('家事の更新に失敗しました:', error)
    }
  }

  // 家事を削除
  const deleteChore = async (choreId: number) => {
    if (!confirm('この家事を削除しますか？')) return

    try {
      const { error } = await supabase
        .from('chores')
        .delete()
        .eq('id', choreId)

      if (error) throw error

      setChores(chores.filter(chore => chore.id !== choreId))
    } catch (error) {
      console.error('家事の削除に失敗しました:', error)
    }
  }

  useEffect(() => {
    fetchChores()
  }, [user])

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">家事を読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">家事一覧</h2>
      
      {/* 新しい家事を追加するフォーム */}
      <form onSubmit={addChore} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newChore}
            onChange={(e) => setNewChore(e.target.value)}
            placeholder="新しい家事を入力..."
            aria-label="新しい家事"
            className="flex-1 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300 bg-white text-gray-900 placeholder-gray-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-400"
            disabled={isAdding}
          />
          <button
            type="submit"
            disabled={isAdding || !newChore.trim()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAdding ? '追加中...' : '追加'}
          </button>
        </div>
      </form>

      {/* 家事一覧 */}
      {chores.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          まだ家事が登録されていません。<br />
          上のフォームから家事を追加してみましょう！
        </div>
      ) : (
        <div className="space-y-3">
          {chores.map((chore) => (
            <div
              key={chore.id}
              className={`flex items-center justify-between p-4 border rounded-lg ${
                chore.done
                  ? 'bg-green-50 border-green-200'
                  : 'bg-white border-gray-200 dark:bg-zinc-900 dark:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleChore(chore.id, chore.done)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    chore.done
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-300 hover:border-green-500 dark:border-zinc-600'
                  }`}
                >
                  {chore.done && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                <div className="flex flex-col">
                  <span
                    className={`text-lg ${
                      chore.done
                        ? 'line-through text-gray-500'
                        : 'text-gray-900 dark:text-zinc-100'
                    }`}
                  >
                    {chore.title}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-zinc-400">
                    {chore.owner_id === user?.id ? '自分が作成' : 'パートナーが作成'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => deleteChore(chore.id)}
                className="px-3 py-1 text-red-600 hover:bg-red-50 rounded transition-colors dark:hover:bg-red-950/30"
              >
                削除
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}