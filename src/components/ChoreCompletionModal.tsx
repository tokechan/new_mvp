'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/Button'
import { Chore } from '@/types/chore'

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
      <DialogContent className="sm:max-w-md">
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
            onClick={onClose}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            キャンセル
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isProcessing}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
          >
            {isProcessing ? '処理中...' : '完了'}
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