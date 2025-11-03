'use client'

import { ensurePushSubscriptionSafe, disablePushSubscriptionSafe } from './pushSubscriptionSafe'
import type {
  PushSubscriptionResult,
  PushUnsubscriptionResult,
} from './pushSubscriptionTypes'

export type {
  PushSubscriptionState,
  PushSubscriptionResult,
  PushUnsubscriptionState,
  PushUnsubscriptionResult,
} from './pushSubscriptionTypes'

const isPwaEnabled = process.env.NEXT_PUBLIC_ENABLE_PWA === 'true'
const isPushFeatureEnabled = process.env.NEXT_PUBLIC_ENABLE_PUSH_SUBSCRIPTIONS === 'true'
const vapidPublicKey = (process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY ?? '').trim()
const bffBaseUrl = (process.env.NEXT_PUBLIC_BFF_URL ?? '').trim()

const logFlags = () => {
  console.debug('[Push] Flags', {
    isPwaEnabled,
    isPushFeatureEnabled,
    vapidPublicKeyLength: vapidPublicKey.length,
  })
}

export async function ensurePushSubscription(): Promise<PushSubscriptionResult> {
  logFlags()

  if (!isPwaEnabled || !isPushFeatureEnabled) {
    return { state: 'unsupported', message: 'Push feature is disabled.' }
  }

  if (!vapidPublicKey) {
    return { state: 'unsupported', message: 'VAPID public key is not configured.' }
  }

  return ensurePushSubscriptionSafe(vapidPublicKey, bffBaseUrl || undefined)
}

export async function disablePushSubscription(): Promise<PushUnsubscriptionResult> {
  if (!isPwaEnabled || !isPushFeatureEnabled) {
    return { state: 'unsupported', message: 'Push feature is disabled.' }
  }

  return disablePushSubscriptionSafe(bffBaseUrl || undefined)
}
