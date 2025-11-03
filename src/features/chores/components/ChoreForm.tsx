'use client'

import { useState } from 'react'
import { AlertCircle, Info } from 'lucide-react'

interface ChoreFormProps {
  onAdd: (title: string, partnerId?: string) => Promise<boolean>
  partnerId?: string | null
  isAdding: boolean
}

/**
 * 家事追加フォームコンポーネント
 * 新しい家事の入力と追加の責務を担当
 */
export function ChoreForm({ onAdd, partnerId, isAdding }: ChoreFormProps) {
  const [newChoreTitle, setNewChoreTitle] = useState('')
  const [error, setError] = useState<string | null>(null)

  /**
   * フォーム送信処理
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const title = newChoreTitle.trim()
    if (!title) {
      setError('家事のタイトルを入力してください')
      return
    }

    if (title.length > 100) {
      setError('タイトルは100文字以内で入力してください')
      return
    }

    setError(null)
    
    try {
      const success = await onAdd(title, partnerId || undefined)
      if (success) {
        setNewChoreTitle('')
        setError(null)
      }
    } catch (error: any) {
      console.error('家事の追加に失敗:', error)
      setError(error.message || '家事の追加に失敗しました')
    }
  }

  /**
   * 入力値の変更処理
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setNewChoreTitle(value)
    
    // リアルタイムバリデーション
    if (error && value.trim()) {
      setError(null)
    }
  }

  /**
   * Enterキーでの送信処理
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  return (
    <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        新しい家事を追加
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="chore-title" className="block text-sm font-medium text-muted-foreground mb-2">
            家事のタイトル
          </label>
          <input
            id="chore-title"
            data-testid="chore-input"
            type="text"
            value={newChoreTitle}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="例: 洗濯物を干す"
            disabled={isAdding}
            maxLength={100}
            className={`
              w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary
              transition-colors duration-200
              ${error 
                ? 'border-destructive/40 focus:border-destructive focus:ring-destructive' 
                : 'border-border focus:border-primary'
              }
              ${isAdding ? 'bg-muted cursor-not-allowed' : 'bg-background'}
            `}
          />
          
          {/* 文字数カウンター */}
          <div className="flex justify-between items-center mt-1">
            <div className="text-xs text-muted-foreground">
              {partnerId ? 'パートナーと共有されます' : '自分専用の家事として追加されます'}
            </div>
            <div className={`text-xs ${
              newChoreTitle.length > 80 
                ? 'text-destructive' 
                : newChoreTitle.length > 60 
                  ? 'text-warning' 
                  : 'text-muted-foreground'
            }`}>
              {newChoreTitle.length}/100
            </div>
          </div>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
            <p className="text-sm text-destructive flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" aria-hidden="true" />
              {error}
            </p>
          </div>
        )}

        {/* 送信ボタン */}
        <button
          type="submit"
          data-testid="add-chore-button"
          disabled={isAdding || !newChoreTitle.trim()}
          className={`
            w-full py-2 px-4 rounded-lg font-medium transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
            ${isAdding || !newChoreTitle.trim()
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary'
            }
          `}
        >
          {isAdding ? (
            <div className="flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
              追加中...
            </div>
          ) : (
            '家事を追加'
          )}
        </button>
      </form>

      {/* ヒント */}
      <div className="mt-4 p-3 bg-info/10 border border-info/30 rounded-lg">
        <p className="text-sm text-info flex items-center">
          <Info className="w-4 h-4 mr-1 flex-shrink-0" aria-hidden="true" />
          <span>
            <strong>ヒント:</strong> Enterキーでも追加できます。具体的で分かりやすいタイトルをつけると、後で管理しやすくなります。
          </span>
        </p>
      </div>
    </div>
  )
}
