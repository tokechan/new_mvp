"use client"

import type { FC } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'

type MarkdownRendererProps = {
  content: string
}

const MarkdownRenderer: FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <article className="prose prose-neutral prose-lg max-w-none px-4 py-6 leading-relaxed dark:prose-invert sm:px-6 lg:px-8 prose-p:leading-7 prose-li:leading-7">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug, rehypeAutolinkHeadings]}
      >
        {content}
      </ReactMarkdown>
    </article>
  )
}

export default MarkdownRenderer
