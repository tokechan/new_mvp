import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase'

const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
})

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
})

type SubscriptionPayload = z.infer<typeof pushSubscriptionSchema>

type AuthError = 'missing_authorization' | 'invalid_token' | null

export type BffBindings = {
  SUPABASE_URL: string
  SUPABASE_SECRET_KEY: string
  ENABLE_PUSH_SUBSCRIPTIONS?: string
}

export type BffVariables = {
  userId: string | null
  supabase: SupabaseClient<Database>
  authError: AuthError
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

async function authenticateRequest(
  supabase: SupabaseClient<Database>,
  authorizationHeader: string | null | undefined,
): Promise<{ userId: string | null; authError: AuthError }> {
  if (!authorizationHeader?.toLowerCase().startsWith('bearer ')) {
    return { userId: null, authError: 'missing_authorization' }
  }

  const token = authorizationHeader.slice('bearer '.length).trim()
  if (!token) {
    return { userId: null, authError: 'missing_authorization' }
  }

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) {
    return { userId: null, authError: 'invalid_token' }
  }

  return { userId: data.user.id, authError: null }
}

function mapPayloadToRow(userId: string, payload: SubscriptionPayload) {
  return {
    user_id: userId,
    endpoint: payload.endpoint,
    expiration_time: payload.expirationTime ? new Date(payload.expirationTime).toISOString() : null,
    keys: payload.keys,
  }
}

export function createBffApp() {
  const app = new Hono<{ Bindings: BffBindings; Variables: BffVariables }>()

  app.use('*', async (c, next) => {
    const supabase = getSupabaseClient(c.env)
    c.set('supabase', supabase)

    const { userId, authError } = await authenticateRequest(supabase, c.req.header('authorization'))
    c.set('userId', userId)
    c.set('authError', authError)

    await next()
  })

  app.get('/healthz', (c) => c.json({ ok: true }))

  app.post('/push/subscribe', zValidator('json', pushSubscriptionSchema), async (c) => {
    if (c.env.ENABLE_PUSH_SUBSCRIPTIONS !== 'true') {
      return c.json({ ok: false, error: 'push notifications disabled' }, 503)
    }

    const authError = c.get('authError')
    if (authError) {
      return c.json({ ok: false, error: authError }, 401)
    }

    const userId = c.get('userId')
    if (!userId) {
      return c.json({ ok: false, error: 'unauthorized' }, 401)
    }

    const supabase = c.get('supabase')
    const subscription = c.req.valid('json')
    const upsertPayload = mapPayloadToRow(userId, subscription)

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
        userId,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        expirationTime: subscription.expirationTime ?? null,
      },
    })
  })

  app.post('/push/unsubscribe', zValidator('json', unsubscribeSchema), async (c) => {
    if (c.env.ENABLE_PUSH_SUBSCRIPTIONS !== 'true') {
      return c.json({ ok: false, error: 'push notifications disabled' }, 503)
    }

    const authError = c.get('authError')
    if (authError) {
      return c.json({ ok: false, error: authError }, 401)
    }

    const userId = c.get('userId')
    if (!userId) {
      return c.json({ ok: false, error: 'unauthorized' }, 401)
    }

    const supabase = c.get('supabase')
    const { endpoint } = c.req.valid('json')

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
