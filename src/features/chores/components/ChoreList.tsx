'use client'

import { Chore } from '@/types/chore'
import { ChoreItem } from './ChoreItem'
import { Home, ClipboardList } from 'lucide-react'
import { useAuthState } from '@/hooks/useAuthState'

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
  const { user } = useAuthState()
  
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
      <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-muted-foreground">家事を読み込み中...</span>
        </div>
      </div>
    )
  }

  if (chores.length === 0) {
    return (
      <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
        <div className="text-center py-8">
          <Home className="w-10 h-10 mb-4 mx-auto text-muted-foreground" aria-hidden="true" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            まだ家事が登録されていません
          </h3>
          <p className="text-muted-foreground">
            上のフォームから最初の家事を追加してみましょう！
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <span className="flex items-center gap-2"><ClipboardList className="w-5 h-5" aria-hidden="true" /> 家事一覧</span>
          <span className="text-sm font-normal text-muted-foreground">
            ({chores.length}件)
          </span>
        </h2>
      </div>
      
      <div className="divide-y divide-border">
        {chores.map((chore) => (
          <ChoreItem
            key={chore.id}
            chore={chore}
            onToggle={onToggleChore}
            onDelete={onDeleteChore}
            currentUserId={user?.id}
            isOwnChore={chore.owner_id === user?.id}
            partnerName="パートナー"
            showThankYou={false}
            onShowThankYou={() => {}}
            onHideThankYou={() => {}}
            partnerInfo={null}
          />
        ))}
      </div>
    </div>
  )
}