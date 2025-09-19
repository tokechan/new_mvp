'use client'

import { Chore } from '@/types/chore'

interface ChoreListProps {
  chores: Chore[]
  isLoading: boolean
  onToggleChore: (choreId: string, currentDone: boolean) => Promise<void>
  onDeleteChore: (choreId: string) => Promise<void>
}

/**
 * 家事一覧表示コンポーネント
 * ChoresList.tsxから分離された家事リスト表示UI
 */
export function ChoreList({ chores, isLoading, onToggleChore, onDeleteChore }: ChoreListProps) {
  /**
   * 日付フォーマット関数
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return '今日'
    } else if (diffDays === 1) {
      return '昨日'
    } else if (diffDays < 7) {
      return `${diffDays}日前`
    } else {
      return date.toLocaleDateString('ja-JP', {
        month: 'short',
        day: 'numeric'
      })
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-gray-600">家事を読み込み中...</span>
        </div>
      </div>
    )
  }

  if (chores.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🏠</div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            まだ家事が登録されていません
          </h3>
          <p className="text-gray-600">
            上のフォームから最初の家事を追加してみましょう！
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          📋 家事一覧
          <span className="text-sm font-normal text-gray-500">
            ({chores.length}件)
          </span>
        </h2>
      </div>
      
      <div className="divide-y divide-gray-100">
        {chores.map((chore) => (
          <div
            key={chore.id}
            className={`p-4 transition-colors ${
              chore.done ? 'bg-green-50' : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <button
                  onClick={() => onToggleChore(chore.id, chore.done)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    chore.done
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-300 hover:border-green-400'
                  }`}
                >
                  {chore.done && '✓'}
                </button>
                
                <div className="flex-1">
                  <h3
                    className={`font-medium transition-colors ${
                      chore.done
                        ? 'text-green-700 line-through'
                        : 'text-gray-800'
                    }`}
                  >
                    {chore.title}
                  </h3>
                  
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    <span>👤 {chore.owner_name || '不明'}</span>
                    <span>📅 {formatDate(chore.created_at)}</span>
                    {chore.done && chore.completed_at && (
                      <span className="text-green-600">
                        ✅ {formatDate(chore.completed_at)}に完了
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => onDeleteChore(chore.id)}
                className="ml-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                title="削除"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}