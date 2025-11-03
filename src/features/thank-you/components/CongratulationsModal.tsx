'use client'

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/Button'
import { Chore } from '@/types/chore'
import { ThumbsUp, X } from 'lucide-react'

interface CongratulationsModalProps {
  /** モーダルの表示状態 */
  isOpen: boolean
  /** モーダルを閉じる関数 */
  onClose: () => void
  /** 完了した家事 */
  chore: Chore | null
}

/**
 * 家事完了後に「お疲れ様でした！」メッセージを表示するモーダルコンポーネント
 */
export function CongratulationsModal({
  isOpen,
  onClose,
  chore
}: CongratulationsModalProps) {
  if (!chore) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-3xl border-none bg-card p-0 shadow-2xl [&>button]:hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/60 text-center space-y-2">
          <DialogTitle className="text-xl font-bold text-foreground">
            家事を完了しました！
          </DialogTitle>
          <p className="text-sm text-muted-foreground">お疲れさまでした、ひと息つきましょう。</p>
        </DialogHeader>

        <div className="px-6 py-6">
          <div className="rounded-2xl border border-primary/30 bg-primary/5 px-5 py-6 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-primary/20 text-primary flex items-center justify-center">
              <ThumbsUp className="w-7 h-7" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">完了した家事</p>
              <p className="text-lg font-semibold text-foreground">{chore.title}</p>
              <p className="text-base font-semibold text-primary">お疲れさまでした！</p>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 pb-6 pt-0 flex !flex-row !justify-center">
          <Button
            aria-label="閉じる"
            onClick={onClose}
            size="icon"
            variant="secondary"
            className="h-12 w-12 rounded-full border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
          >
            <X className="w-5 h-5" aria-hidden="true" />
            <span className="sr-only">閉じる</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
