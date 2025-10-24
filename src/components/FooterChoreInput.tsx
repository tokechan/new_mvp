'use client'

import { useState, useCallback } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Plus } from 'lucide-react'
import { useChores } from '@/hooks/useChores'
import { useScreenReader } from '@/hooks/useScreenReader'
import { useNotifications } from '@/contexts/NotificationContext'

/**
 * モバイル用の固定フッター入力
 * 家事追加の簡易フォーム（Chat風のUI）
 */
export default function FooterChoreInput() {
  const { isAdding, addChore } = useChores()
  const { announceFormError, announceSuccess, announceError } = useScreenReader()
  const { addNotification } = useNotifications()
  const [text, setText] = useState('')

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const value = text.trim()
    if (!value) {
      announceFormError('家事名', '家事名を入力してください')
      return
    }

    try {
      await addChore(value)
      setText('')
      announceSuccess(`家事「${value}」を追加しました`)
      addNotification({
        title: '家事を追加しました',
        type: 'success',
        message: `家事「${value}」を追加しました`
      })
    } catch (error) {
      console.error('フッター入力からの家事追加エラー:', error)
      announceError('家事の追加に失敗しました')
      addNotification({
        title: 'エラー',
        type: 'error',
        message: '家事の追加に失敗しました'
      })
    }
  }, [text, addChore, announceFormError, announceSuccess, announceError, addNotification])

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-50 z-50">
      <form onSubmit={handleSubmit} className="px-3 py-2">
        <div className="relative">
          <Input
            type="text"
            placeholder="新しい家事を入力"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isAdding}
            aria-label="新しい家事名"
            className="w-full h-11 pr-12 rounded-full text-base"
          />
          <Button
            type="submit"
            disabled={isAdding || !text.trim()}
            aria-label="家事を追加"
            className="absolute right-1.5 top-1.5 h-8 w-8 rounded-full bg-blue-50 text-blue-700 border border-blue-300 hover:bg-blue-100 hover:border-blue-400 focus:ring-2 focus:ring-blue-400"
            variant="default"
            size="icon"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </form>
    </div>
  )
}