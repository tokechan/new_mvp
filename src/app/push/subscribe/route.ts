import { createBffApp, type BffBindings } from '@/bff/app'

const app = createBffApp()

function resolveBindings(): BffBindings {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseSecret = process.env.SUPABASE_SECRET_KEY

  if (!supabaseUrl || !supabaseSecret) {
    throw new Error('Supabase environment variables are not configured.')
  }

  return {
    SUPABASE_URL: supabaseUrl,
    SUPABASE_SECRET_KEY: supabaseSecret,
    ENABLE_PUSH_SUBSCRIPTIONS: process.env.ENABLE_PUSH_SUBSCRIPTIONS,
  }
}

export async function POST(request: Request) {
  const env = resolveBindings()
  const executionContext = {
    waitUntil: (_promise: Promise<unknown>) => {},
    passThroughOnException: () => {},
  } as ExecutionContext

  return app.fetch(request, env, executionContext)
}
