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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900 text-center">
            家事を完了しました！
          </DialogTitle>
        </DialogHeader>

        <div className="py-6 flex justify-center">
          <div className="inline-flex items-center space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
              {/* サムズアップアイコンに変更 */}
              <ThumbsUp className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-green-800">{chore.title}</p>
              <p className="text-lg font-semibold text-green-600 mt-1">お疲れさまでした！</p>
            </div>
          </div>
        </div>

        <DialogFooter className="justify-center sm:!justify-center">
          <Button
            aria-label="閉じる"
            onClick={onClose}
            size="icon"
            className="h-12 w-12 rounded-full p-0 grid place-items-center text-white bg-green-600 hover:bg-green-700"
          >
            <X className="w-6 h-6" aria-hidden="true" />
            <span className="sr-only">閉じる</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}