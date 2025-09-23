'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useScreenReader } from '@/hooks/useScreenReader'

interface ChoreAddFormProps {
  onAddChore: (choreName: string) => Promise<void>
  isAdding: boolean
}

/**
 * 家事追加フォームコンポーネント
 * 単一責務：新しい家事の追加のみを担当
 */
export function ChoreAddForm({ onAddChore, isAdding }: ChoreAddFormProps) {
  const [newChore, setNewChore] = useState('')
  const { announceFormError } = useScreenReader()

  /**
   * フォーム送信ハンドラー
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newChore.trim()) {
      announceFormError('家事名', '家事名を入力してください')
      return
    }

    try {
      await onAddChore(newChore.trim())
      setNewChore('')
    } catch (error) {
      // エラーハンドリングは親コンポーネントで行う
      console.error('家事追加エラー:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 sm:gap-3">
      <Input
        type="text"
        placeholder="新しい家事を入力"
        value={newChore}
        onChange={(e) => setNewChore(e.target.value)}
        disabled={isAdding}
        className="flex-1 text-sm sm:text-base"
        aria-label="新しい家事名"
      />
      <Button 
        type="submit" 
        disabled={isAdding || !newChore.trim()}
        className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base"
      >
        {isAdding ? '追加中...' : '追加'}
      </Button>
    </form>
  )
}