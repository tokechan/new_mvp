import { Suspense } from 'react'
import CompletedChoresClient from './CompletedChoresClient'

export default function CompletedChoresPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12">読み込み中...</div>}>
      <CompletedChoresClient />
    </Suspense>
  )
}
