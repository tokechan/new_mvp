'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/ui/accordion'

interface RealtimeEvents {
  connectionStatus: string
  inserts: number
  updates: number
  deletes: number
  lastEvent: string | null
}

interface RealtimeDebugPanelProps {
  realtimeEvents: RealtimeEvents
}

/**
 * リアルタイム接続状況デバッグパネルコンポーネント
 * 単一責務：開発環境でのリアルタイム接続状況表示のみを担当
 */
export function RealtimeDebugPanel({ realtimeEvents }: RealtimeDebugPanelProps) {
  // 本番環境では表示しない
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="realtime-debug">
        <AccordionTrigger className="text-sm">
          リアルタイム接続状況 ({realtimeEvents.connectionStatus})
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2 text-sm">
            <div>接続状態: {realtimeEvents.connectionStatus}</div>
            <div>挿入: {realtimeEvents.inserts}回</div>
            <div>更新: {realtimeEvents.updates}回</div>
            <div>削除: {realtimeEvents.deletes}回</div>
            <div>最後のイベント: {realtimeEvents.lastEvent || 'なし'}</div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}