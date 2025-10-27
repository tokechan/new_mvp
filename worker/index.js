// `.open-next/worker.js` is generated at build time by OpenNext.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import defaultWorker, {
  DOQueueHandler,
  DOShardedTagCache,
  BucketCachePurge,
} from '../.open-next/worker.js'
import { createBffApp } from '../src/bff/app'

const bff = createBffApp()

export { DOQueueHandler, DOShardedTagCache, BucketCachePurge }

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    if (url.pathname.startsWith('/api/push/')) {
      const rewrittenUrl = new URL(request.url)
      rewrittenUrl.pathname = url.pathname.replace('/api', '')
      const forwardRequest = new Request(rewrittenUrl.toString(), request)
      return bff.fetch(forwardRequest, env, ctx)
    }

    if (url.pathname.startsWith('/push/')) {
      return bff.fetch(request, env, ctx)
    }

    return defaultWorker.fetch(request, env, ctx)
  },
}
