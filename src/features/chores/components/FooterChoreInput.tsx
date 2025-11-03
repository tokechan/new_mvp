'use client'

import { type CSSProperties, useState, useCallback } from 'react'
import { Input } from '@/shared/ui/Input'
import { Button } from '@/shared/ui/Button'
import { Plus } from 'lucide-react'
import { useChores } from '@/features/chores/hooks/useChores'
import { ChoreLimitReachedError } from '@/features/chores/services/choreService'
import { useScreenReader } from '@/shared/hooks/useScreenReader'
import { useNotifications } from '@/contexts/NotificationContext'
import { useToast } from '@/shared/ui/toast'

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

  const footerOffsetStyle: CSSProperties = {
    bottom: 'calc(env(safe-area-inset-bottom, 0px) + 3.5rem)',
  }

  return (
    <div className="fixed left-0 right-0 z-50 pointer-events-none" style={footerOffsetStyle}>
      <form onSubmit={handleSubmit} className="px-3 pt-3 pb-5 pointer-events-auto">
        <div className="mx-auto max-w-3xl">
          <div className="relative overflow-hidden rounded-[30px] border border-white/30 bg-white/5 backdrop-blur-[45px] backdrop-saturate-200 shadow-[0_30px_60px_rgba(15,23,42,0.18)] focus-within:ring-2 focus-within:ring-primary/40 transition-all">
            {/* Liquid装飾（半透明のバブル） */}
            <div className="absolute -top-12 -left-14 w-56 h-56 bg-primary/50 rounded-full blur-[110px] opacity-60 pointer-events-none" />
            <div className="absolute -bottom-16 -right-14 w-64 h-64 bg-primary/40 rounded-full blur-[130px] opacity-45 pointer-events-none" />

            <Input
              type="text"
              placeholder="新しい家事を入力"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isAdding}
              aria-label="新しい家事名"
              className="w-full h-12 pr-20 rounded-[28px] text-base bg-white/5 text-foreground placeholder:text-muted-foreground border border-white/25 shadow-[inset_0_8px_18px_rgba(255,255,255,0.25)] focus-visible:ring-0 focus:outline-none backdrop-blur-[30px] backdrop-saturate-150"
            />
            <Button
              type="submit"
              disabled={isAdding || !text.trim()}
              aria-label="家事を追加"
              className="absolute right-4 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full bg-white/25 text-primary-600 border border-white/50 shadow-[0_10px_20px_rgba(15,23,42,0.18)] hover:bg-white/35 focus:ring-2 focus:ring-primary/60 transition backdrop-blur-[30px]"
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
