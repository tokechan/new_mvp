'use client'

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/Button'
import { Chore } from '@/types/chore'

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

        <div className="py-6">
          <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-medium text-green-800">{chore.title}</p>
              <p className="text-lg font-semibold text-green-600 mt-1">お疲れさまでした！</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={onClose}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            閉じる
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}