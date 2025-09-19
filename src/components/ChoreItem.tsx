'use client'

import { useState } from 'react'
import { ExtendedChore } from '@/hooks/useChores'

interface ChoreItemProps {
  chore: ExtendedChore
  onToggle: (choreId: number, currentDone: boolean) => Promise<boolean>
  onDelete: (choreId: number) => Promise<boolean>
  currentUserId: string
}

/**
 * 個別の家事アイテムを表示するコンポーネント
 * 家事の表示、完了切り替え、削除の責務を担当
 */
export function ChoreItem({ chore, onToggle, onDelete, currentUserId }: ChoreItemProps) {
  const [isToggling, setIsToggling] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  /**
   * 家事の完了状態を切り替える
   */
  const handleToggle = async () => {
    if (isToggling) return
    
    setIsToggling(true)
    try {
      await onToggle(chore.id, chore.done ?? false)
    } catch (error) {
      console.error('家事の完了状態変更に失敗:', error)
      // エラーは親コンポーネントで処理される
    } finally {
      setIsToggling(false)
    }
  }

  /**
   * 家事を削除する
   */
  const handleDelete = async () => {
    if (isDeleting) return
    
    if (!confirm('この家事を削除しますか？')) return
    
    setIsDeleting(true)
    try {
      await onDelete(chore.id)
    } catch (error) {
      console.error('家事の削除に失敗:', error)
      // エラーは親コンポーネントで処理される
    } finally {
      setIsDeleting(false)
    }
  }

  /**
   * 最新の完了記録を取得
   */
  const getLatestCompletion = () => {
    if (!chore.completions || chore.completions.length === 0) return null
    
    return chore.completions.reduce((latest, completion) => {
      return new Date(completion.created_at) > new Date(latest.created_at) 
        ? completion 
        : latest
    })
  }

  /**
   * 完了者の表示名を取得
   */
  const getCompletedByText = () => {
    const latestCompletion = getLatestCompletion()
    if (!latestCompletion) return ''
    
    const isCompletedByCurrentUser = latestCompletion.user_id === currentUserId
    return isCompletedByCurrentUser ? 'あなた' : 'パートナー'
  }

  /**
   * 完了日時のフォーマット
   */
  const formatCompletionDate = () => {
    const latestCompletion = getLatestCompletion()
    if (!latestCompletion) return ''
    
    const date = new Date(latestCompletion.created_at)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60)
      return `${diffInMinutes}分前`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}時間前`
    } else {
      return date.toLocaleDateString('ja-JP', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  return (
    <div className={`
      p-4 border rounded-lg transition-all duration-200
      ${chore.done 
        ? 'bg-green-50 border-green-200 text-green-800' 
        : 'bg-white border-gray-200 hover:border-gray-300'
      }
    `}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          {/* 完了チェックボックス */}
          <button
            onClick={handleToggle}
            disabled={isToggling}
            className={`
              w-6 h-6 rounded-full border-2 flex items-center justify-center
              transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500
              ${chore.done
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-gray-300 hover:border-green-400'
              }
              ${isToggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {isToggling ? (
              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : chore.done ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : null}
          </button>

          {/* 家事タイトルと完了情報 */}
          <div className="flex-1">
            <h3 className={`
              font-medium transition-all duration-200
              ${chore.done ? 'line-through text-green-700' : 'text-gray-900'}
            `}>
              {chore.title}
            </h3>
            
            {/* 完了情報 */}
            {chore.done && (
              <p className="text-sm text-green-600 mt-1">
                {getCompletedByText()}が{formatCompletionDate()}に完了
              </p>
            )}
            
            {/* 作成者情報 */}
            <p className="text-xs text-gray-500 mt-1">
              作成者: {chore.owner_id === currentUserId ? 'あなた' : 'パートナー'}
            </p>
          </div>
        </div>

        {/* 削除ボタン */}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className={`
            ml-3 p-2 text-gray-400 hover:text-red-500 rounded-lg
            transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500
            ${isDeleting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          title="家事を削除"
        >
          {isDeleting ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}