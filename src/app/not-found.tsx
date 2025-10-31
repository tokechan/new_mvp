import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'ページが見つかりません - ThankYou Chores',
  description: 'お探しのページは見つかりませんでした。',
}

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center dark:bg-zinc-800">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4 dark:text-zinc-100">
            ページが見つかりません
          </h1>
          <p className="text-gray-600 mb-6 dark:text-zinc-400">
            お探しのページは存在しないか、移動された可能性があります。
          </p>
          <div className="space-y-3">
            <Link
              href="/app"
              className="block w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              ホームに戻る
            </Link>
            <Link
              href="/auth/signin"
              className="block w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              ログインページ
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
