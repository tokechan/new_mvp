'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/Button'
import { Chore } from '@/types/chore'
import { Check, X } from 'lucide-react'

interface ChoreCompletionModalProps {
  /** モーダルの表示状態 */
  isOpen: boolean
  /** モーダルを閉じる関数 */
  onClose: () => void
  /** 完了対象の家事 */
  chore: Chore | null
  /** 完了処理を実行する関数 */
  onConfirm: (choreId: string) => Promise<void>
  /** ありがとうページに遷移する関数 */
  onThankYou?: (choreId: string) => void
}

/**
 * 家事完了時に表示されるモーダルコンポーネント
 * 完了確認とありがとうメッセージ送信の選択肢を提供
 */
export function ChoreCompletionModal({
  isOpen,
  onClose,
  chore,
  onConfirm,
  onThankYou
}: ChoreCompletionModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  /**
   * 完了処理を実行
   */
  const handleConfirm = async () => {
    if (!chore || isProcessing) return

    setIsProcessing(true)
    try {
      await onConfirm(String(chore.id))
      onClose()
    } catch (error) {
      console.error('家事完了処理エラー:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  /**
   * 完了してありがとうページに遷移
   */
  const handleConfirmAndThankYou = async () => {
    if (!chore || isProcessing) return

    setIsProcessing(true)
    try {
      await onConfirm(String(chore.id))
      onClose()
      if (onThankYou) {
        onThankYou(String(chore.id))
      }
    } catch (error) {
      console.error('家事完了処理エラー:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  if (!chore) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">
            家事を完了しますか？
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            「{chore.title}」を完了状態にします。
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onClose}
            disabled={isProcessing}
            className="sm:h-10 sm:w-10 p-0 grid place-items-center"
          >
            <X className="w-5 h-5" aria-hidden="true" />
            <span className="sr-only">キャンセル</span>
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isProcessing}
            size="icon"
            className="sm:h-10 sm:w-10 p-0 grid place-items-center bg-green-600 hover:bg-green-700"
          >
            {isProcessing ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check className="w-5 h-5" aria-hidden="true" />
            )}
            <span className="sr-only">完了</span>
          </Button>
          {onThankYou && (
            <Button
              onClick={handleConfirmAndThankYou}
              disabled={isProcessing}
              className="w-full sm:w-auto bg-pink-600 hover:bg-pink-700"
            >
              {isProcessing ? '処理中...' : '完了してありがとうを送る'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}