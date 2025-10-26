// .open-next/worker はビルド後に生成されるため型だけ補う
// @ts-ignore - resolved at build time by OpenNext
import defaultWorker, {
  DOQueueHandler,
  DOShardedTagCache,
  BucketCachePurge,
} from '../.open-next/worker'
import { createBffApp } from '../src/bff/app'

const bff = createBffApp()

export { DOQueueHandler, DOShardedTagCache, BucketCachePurge }

export default {
  async fetch(request: Request, env: CloudflareEnv, ctx: ExecutionContext) {
    const url = new URL(request.url)

    if (url.pathname.startsWith('/push/')) {
      return bff.fetch(request, env, ctx)
    }

    return defaultWorker.fetch(request, env, ctx)
  },
}
