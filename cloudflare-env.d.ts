import type { BffBindings } from './src/bff/app'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface CloudflareEnv extends BffBindings {}
}
