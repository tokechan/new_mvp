import { notFound } from 'next/navigation'
import MarkdownRenderer from '@/shared/components/MarkdownRenderer'

const LEGAL_PAGES = {
  privacy: {
    title: 'プライバシーポリシー',
    description:
      'YOUDOの個人情報保護方針とデータの取り扱いについてご案内します。',
  },
  terms: {
    title: '利用規約',
    description:
      'YOUDOをご利用いただく際のルールとお願い事項を記載しています。',
  },
} satisfies Record<string, { title: string; description: string }>

// TODO: 本番リリース時に有効化予定のリーガルページ
// const FUTURE_PAGES = {
//   law: {
//     title: '特定商取引法に基づく表記',
//     description:
//       '事業者情報や提供条件など、法令に基づく表記をご確認いただけます。',
//   },
// } as const

type PageParam = keyof typeof LEGAL_PAGES

const LEGAL_CONTENT_LOADERS: Record<PageParam, () => Promise<string>> = {
  privacy: async () => (await import('@/content/legal/privacy.md?raw')).default,
  terms: async () => (await import('@/content/legal/terms.md?raw')).default,
}

export function generateStaticParams() {
  return Object.keys(LEGAL_PAGES).map((page) => ({ page }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ page: PageParam }>
}) {
  const { page } = await params
  const meta = LEGAL_PAGES[page]
  if (!meta) {
    return {}
  }

  return {
    title: `${meta.title} | YOUDO`,
    description: meta.description,
  }
}

async function loadMarkdown(page: PageParam) {
  const loader = LEGAL_CONTENT_LOADERS[page]
  if (!loader) {
    return null
  }

  try {
    return await loader()
  } catch (error) {
    console.error(`Failed to import legal markdown for ${page}`, error)
    return null
  }
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ page: string }>
}) {
  const { page } = await params
  const meta = LEGAL_PAGES[page as PageParam]

  if (!meta) {
    notFound()
  }

  const content = await loadMarkdown(page as PageParam)

  if (!content) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 py-12">
        <header className="px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary/80">
            Legal Information
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {meta.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {meta.description}
          </p>
        </header>

        <MarkdownRenderer content={content} />
      </div>
    </div>
  )
}
