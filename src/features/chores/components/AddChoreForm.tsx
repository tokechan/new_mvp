'use client'

import { useState } from 'react'
import { Plus, Lightbulb } from 'lucide-react'

interface AddChoreFormProps {
  onAddChore: (title: string) => Promise<void>
  isLoading: boolean
}

/**
 * 新しい家事追加フォームコンポーネント
 * ChoresList.tsxから分離された家事追加UI
 */
export function AddChoreForm({ onAddChore, isLoading }: AddChoreFormProps) {
  const [newChoreTitle, setNewChoreTitle] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  /**
   * フォーム送信処理
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newChoreTitle.trim() || isSubmitting) return
    
    setIsSubmitting(true)
    try {
      await onAddChore(newChoreTitle.trim())
      setNewChoreTitle('') // 成功時のみクリア
    } catch (error) {
      console.error('家事追加エラー:', error)
      // エラー時はタイトルを保持してユーザーが再試行しやすくする
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Enterキーでの送信処理
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  const isDisabled = isLoading || isSubmitting || !newChoreTitle.trim()

  return (
    <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
      <h2 className="text-lg font-semibold text-foreground mb-4">
        新しい家事を追加
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="chore-title" className="block text-sm font-medium text-muted-foreground mb-2">
            家事の内容
          </label>
          <input
            id="chore-title"
            type="text"
            value={newChoreTitle}
            onChange={(e) => setNewChoreTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="例: 洗濯物を干す、食器を洗う"
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            disabled={isLoading || isSubmitting}
            maxLength={100}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {newChoreTitle.length}/100文字
          </p>
        </div>
        
        <button
          type="submit"
          disabled={isDisabled}
          className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
              追加中...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" aria-hidden="true" />
              家事を追加
            </>
          )}
        </button>
      </form>
      
      <p className="text-sm text-muted-foreground mt-3">
        <span className="inline-flex items-center gap-1"><Lightbulb className="w-4 h-4" aria-hidden="true" /> ヒント: Enterキーでも追加できます</span>
      </p>
    </div>
  )
}