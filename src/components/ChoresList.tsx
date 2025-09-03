'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase'

type Chore = Database['public']['Tables']['chores']['Row']
type ChoreInsert = Database['public']['Tables']['chores']['Insert']

export default function ChoresList() {
  const { user } = useAuth()
  const [chores, setChores] = useState<Chore[]>([])
  const [loading, setLoading] = useState(true)
  const [newChore, setNewChore] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  // 家事一覧を取得
  const fetchChores = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('chores')
        .select('*')
        .eq('assigned_to', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setChores(data || [])
    } catch (error) {
      console.error('家事の取得に失敗しました:', error)
    } finally {
      setLoading(false)
    }
  }

  // 新しい家事を追加
  const addChore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newChore.trim()) return

    setIsAdding(true)
    try {
      const choreData: ChoreInsert = {
        title: newChore.trim(),
        assigned_to: user.id,
        created_by: user.id,
        status: 'pending'
      }

      const { data, error } = await supabase
        .from('chores')
        .insert([choreData])
        .select()
        .single()

      if (error) throw error

      setChores([data, ...chores])
      setNewChore('')
    } catch (error) {
      console.error('家事の追加に失敗しました:', error)
    } finally {
      setIsAdding(false)
    }
  }

  // 家事の完了状態を切り替え
  const toggleChore = async (choreId: string, currentStatus: 'pending' | 'completed') => {
    try {
      const newStatus = currentStatus === 'pending' ? 'completed' : 'pending'
      const { error } = await supabase
        .from('chores')
        .update({ status: newStatus })
        .eq('id', choreId)

      if (error) throw error

      setChores(chores.map(chore => 
        chore.id === choreId 
          ? { ...chore, status: newStatus }
          : chore
      ))
    } catch (error) {
      console.error('家事の更新に失敗しました:', error)
    }
  }

  // 家事を削除
  const deleteChore = async (choreId: string) => {
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
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                chore.status === 'completed'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleChore(chore.id, chore.status)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    chore.status === 'completed'
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-300 hover:border-green-500'
                  }`}
                >
                  {chore.status === 'completed' && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                <span
                  className={`text-lg ${
                    chore.status === 'completed'
                      ? 'line-through text-gray-500'
                      : 'text-gray-900'
                  }`}
                >
                  {chore.title}
                </span>
              </div>
              <button
                onClick={() => deleteChore(chore.id)}
                className="px-3 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
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