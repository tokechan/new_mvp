import { createBffApp, type BffBindings } from '@/bff/app'

export const runtime = 'edge'

const app = createBffApp()

export async function POST(request: Request) {
  const env: BffBindings = {
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY ?? '',
    ENABLE_PUSH_SUBSCRIPTIONS: process.env.ENABLE_PUSH_SUBSCRIPTIONS,
  }

  return app.fetch(request, env)
}
