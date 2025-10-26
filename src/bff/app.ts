import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
})

export type BffBindings = {
  SUPABASE_URL: string
  SUPABASE_SECRET_KEY: string
  ENABLE_PUSH_SUBSCRIPTIONS?: string
}

export type BffVariables = {
  userId: string | null
}

export function createBffApp() {
  const app = new Hono<{ Bindings: BffBindings; Variables: BffVariables }>()

  // TODO: replace with real auth middleware once ready.
  app.use('*', async (c, next) => {
    if (!c.get('userId')) {
      c.set('userId', null)
    }
    await next()
  })

  app.get('/healthz', (c) => c.json({ ok: true }))

  app.post('/push/subscribe', zValidator('json', pushSubscriptionSchema), async (c) => {
    if (c.env.ENABLE_PUSH_SUBSCRIPTIONS !== 'true') {
      return c.json({ ok: false, error: 'push notifications disabled' }, 503)
    }

    const userId = c.get('userId')
    if (!userId) {
      return c.json({ ok: false, error: 'unauthorized' }, 401)
    }

    const subscription = c.req.valid('json')

    // TODO: Persist subscription into Supabase push_subscriptions table.
    // Placeholder keeps the happy-path response shape stable while wiring BFF.

    return c.json({ ok: true })
  })

  app.onError((error, c) => {
    console.error('[BFF] Unhandled error', error)
    return c.json({ ok: false, error: 'internal_error' }, 500)
  })

  app.notFound((c) => c.json({ ok: false, error: 'not_found' }, 404))

  return app
}
