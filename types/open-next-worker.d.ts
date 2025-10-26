declare module '../.open-next/worker.js' {
  const worker: {
    fetch(request: Request, env: CloudflareEnv, ctx: ExecutionContext): Promise<Response>
  }

  export const DOQueueHandler: any
  export const DOShardedTagCache: any
  export const BucketCachePurge: any

  export default worker
}
