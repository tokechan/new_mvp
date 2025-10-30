'use client'

import { useState, useCallback } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Plus } from 'lucide-react'
import { useChores } from '@/hooks/useChores'
import { ChoreLimitReachedError } from '@/services/choreService'
import { useScreenReader } from '@/hooks/useScreenReader'
import { useNotifications } from '@/contexts/NotificationContext'
import { useToast } from '@/components/ui/toast'

/**
 * モバイル用の固定フッター入力
 * 家事追加の簡易フォーム（Chat風のUI）
 */
export default function FooterChoreInput() {
  const { isAdding, addChore } = useChores()
  const { announceFormError, announceSuccess, announceError } = useScreenReader()
  const { addNotification } = useNotifications()
  const { showToast } = useToast()
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
    } catch (error: unknown) {
      if (error instanceof ChoreLimitReachedError) {
        console.warn('家事追加が上限により拒否されました (FooterChoreInput):', error)
        announceError(error.message)
        showToast({ message: error.message, variant: 'warning' })
        addNotification({
          title: '家事を追加できません',
          type: 'warning',
          message: error.message
        })
        return
      }

      console.error('フッター入力からの家事追加エラー:', error)
      announceError('家事の追加に失敗しました')
      addNotification({
        title: 'エラー',
        type: 'error',
        message: '家事の追加に失敗しました'
      })
    }
  }, [text, addChore, announceFormError, announceSuccess, announceError, addNotification, showToast])

  return (
    <div className="fixed bottom-1 left-0 right-0 z-50">
      <form onSubmit={handleSubmit} className="px-3 pt-3 pb-5">
        <div className="mx-auto max-w-3xl">
          <div className="relative overflow-hidden rounded-2xl bg-primary/20 backdrop-blur-md shadow-md focus-within:ring-2 focus-within:ring-primary/60 transition-colors">
            {/* Liquid装飾（半透明のバブル） */}
            <div className="absolute -top-8 -left-6 w-32 h-32 bg-primary/30 rounded-full blur-2xl opacity-60 pointer-events-none" />
            <div className="absolute -bottom-10 -right-8 w-44 h-44 bg-primary/25 rounded-full blur-3xl opacity-50 pointer-events-none" />

            <Input
              type="text"
              placeholder="新しい家事を入力"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isAdding}
              aria-label="新しい家事名"
              className="w-full h-12 pr-16 rounded-2xl text-base bg-white/25 text-foreground placeholder:text-muted-foreground border-0 shadow-none focus-visible:ring-0 focus:outline-none"
            />
            <Button
              type="submit"
              disabled={isAdding || !text.trim()}
              aria-label="家事を追加"
              className="absolute right-2 top-2 h-8 w-8 rounded-full bg-primary/40 text-primary-foreground border border-primary/50 shadow-md hover:bg-primary/50 focus:ring-2 focus:ring-primary/70 transition"
              variant="default"
              size="icon"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
