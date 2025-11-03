'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/Button'
import { Chore } from '@/types/chore'
import { ThumbsUp, Undo2 } from 'lucide-react'

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
          <DialogTitle className="text-lg font-semibold text-foreground">
            家事を完了しますか？
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            「{chore.title}」を完了状態にします。
          </DialogDescription>
        </DialogHeader>

        {/* 横並びで、左が完了（サムズアップ）、右がキャンセル（巻き戻し） */}
        <DialogFooter className="flex flex-row items-center justify-center gap-3 sm:!justify-center">
          {/* 完了（サムズアップ） */}
          <Button
            aria-label="完了"
            onClick={handleConfirm}
            disabled={isProcessing}
            size="icon"
            className="h-12 w-12 rounded-full p-0 grid place-items-center bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            {isProcessing ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <ThumbsUp className="w-6 h-6" aria-hidden="true" />
            )}
            <span className="sr-only">完了</span>
          </Button>

          {/* キャンセル（巻き戻し） */}
          <Button
            aria-label="キャンセル"
            size="icon"
            onClick={onClose}
            disabled={isProcessing}
            className="h-12 w-12 rounded-full p-0 grid place-items-center bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <Undo2 className="w-6 h-6" aria-hidden="true" />
            <span className="sr-only">キャンセル</span>
          </Button>

          {onThankYou && (
            <Button
              onClick={handleConfirmAndThankYou}
              disabled={isProcessing}
              className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              {isProcessing ? '処理中...' : '完了してありがとうを送る'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}