'use client'

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/Button'
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
      <DialogContent className="sm:max-w-md rounded-2xl sm:rounded-2xl [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground text-center">
            家事を完了しました！
          </DialogTitle>
        </DialogHeader>

        <div className="py-6 flex justify-center">
          <div className="inline-flex items-center space-x-3 p-4 bg-primary/10 rounded-lg border border-primary/30">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center animate-bounce">
              {/* サムズアップアイコンに変更 */}
              <ThumbsUp className="w-6 h-6 text-primary-foreground" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-primary">{chore.title}</p>
              <p className="text-lg font-semibold text-primary mt-1">お疲れさまでした！</p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex !flex-row !justify-center !items-center sm:!justify-center sm:!items-center gap-0">
          <Button
            aria-label="閉じる"
            onClick={onClose}
            size="icon"
            className="h-10 w-10 rounded-full p-0 grid place-items-center bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <X className="w-5 h-5" aria-hidden="true" />
            <span className="sr-only">閉じる</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}