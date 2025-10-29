import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase'

const metadataSchema = z
  .object({
    userAgent: z.string().optional(),
    language: z.string().optional(),
    timezone: z.string().optional(),
  })
  .optional()

const pushSubscriptionSchema = z.object({
  userId: z.string().uuid(),
  endpoint: z.string().url(),
  expirationTime: z.union([z.number().int(), z.string().datetime(), z.null()]).optional(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  metadata: metadataSchema,
})

const unsubscribeSchema = z.object({
  userId: z.string().uuid(),
  endpoint: z.string().url(),
})

type SubscriptionPayload = z.infer<typeof pushSubscriptionSchema>

export type BffBindings = {
  SUPABASE_URL: string
  SUPABASE_SECRET_KEY: string
  ENABLE_PUSH_SUBSCRIPTIONS?: string
}

export type BffVariables = {
  supabase: SupabaseClient<Database>
}

let cachedSupabaseClient: SupabaseClient<Database> | null = null

function getSupabaseClient(env: BffBindings) {
  if (!cachedSupabaseClient) {
    if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) {
      throw new Error('Supabase credentials are not configured on the worker environment.')
    }
    cachedSupabaseClient = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
  return cachedSupabaseClient
}

function normalizeExpiration(expiration?: SubscriptionPayload['expirationTime']) {
  if (!expiration) return null
  try {
    if (typeof expiration === 'number') {
      return new Date(expiration).toISOString()
    }
    if (typeof expiration === 'string') {
      return new Date(expiration).toISOString()
    }
  } catch (error) {
    console.warn('[BFF] Failed to normalize expirationTime', { expiration, error })
  }
  return null
}

function mapPayloadToRow(payload: SubscriptionPayload) {
  return {
    user_id: payload.userId,
    endpoint: payload.endpoint,
    expiration_time: normalizeExpiration(payload.expirationTime),
    keys: payload.keys,
  }
}

export function createBffApp() {
  const app = new Hono<{ Bindings: BffBindings; Variables: BffVariables }>()

  app.use('*', async (c, next) => {
    const supabase = getSupabaseClient(c.env)
    c.set('supabase', supabase)
    await next()
  })

  app.get('/healthz', (c) => c.json({ ok: true }))

  app.post('/push/subscribe', zValidator('json', pushSubscriptionSchema), async (c) => {
    if (c.env.ENABLE_PUSH_SUBSCRIPTIONS !== 'true') {
      return c.json({ ok: false, error: 'push notifications disabled' }, 503)
    }

    const supabase = c.get('supabase')
    const subscription = c.req.valid('json')
    const upsertPayload = mapPayloadToRow(subscription)

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(upsertPayload, { onConflict: 'user_id,endpoint', ignoreDuplicates: false })

    if (error) {
      console.error('[BFF] push subscription upsert failed', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      })
      return c.json(
        {
          ok: false,
          error: 'subscription_upsert_failed',
          message: error.message,
          details: error.details,
        },
        500,
      )
    }

    return c.json({
      ok: true,
      subscription: {
        userId: subscription.userId,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        expirationTime: normalizeExpiration(subscription.expirationTime),
        metadata: subscription.metadata ?? null,
      },
    })
  })

  app.post('/push/unsubscribe', zValidator('json', unsubscribeSchema), async (c) => {
    if (c.env.ENABLE_PUSH_SUBSCRIPTIONS !== 'true') {
      return c.json({ ok: false, error: 'push notifications disabled' }, 503)
    }

    const supabase = c.get('supabase')
    const { userId, endpoint } = c.req.valid('json')

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)
      .eq('endpoint', endpoint)

    if (error) {
      console.error('[BFF] push subscription delete failed', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      })
      return c.json(
        {
          ok: false,
          error: 'subscription_delete_failed',
          message: error.message,
          details: error.details,
        },
        500,
      )
    }

    return c.json({ ok: true })
  })

  app.onError((error, c) => {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[BFF] Unhandled error', { message })
    return c.json({ ok: false, error: 'internal_error', message }, 500)
  })

  app.notFound((c) => c.json({ ok: false, error: 'not_found' }, 404))

  return app
}
