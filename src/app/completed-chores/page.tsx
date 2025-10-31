import { Suspense } from 'react'
import dynamic from 'next/dynamic'

export const dynamic = 'force-dynamic'

const CompletedChoresClient = dynamic(() => import('./CompletedChoresClient'), {
  suspense: true,
})

export default function CompletedChoresPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12">読み込み中...</div>}>
      <CompletedChoresClient />
    </Suspense>
  )
}
