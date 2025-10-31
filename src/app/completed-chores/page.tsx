import { Suspense } from 'react'
import nextDynamic from 'next/dynamic'

export const dynamic = 'force-dynamic'

const CompletedChoresClient = nextDynamic(() => import('./CompletedChoresClient'), {
  suspense: true,
})

export default function CompletedChoresPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12">読み込み中...</div>}>
      <CompletedChoresClient />
    </Suspense>
  )
}
