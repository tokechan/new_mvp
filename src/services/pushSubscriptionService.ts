'use client'

import { supabase } from '@/lib/supabase'
import { ApiClient, ApiError, createApiClient } from './apiClient'

const isPwaEnabled = process.env.NEXT_PUBLIC_ENABLE_PWA === 'true'
const isPushFeatureEnabled = process.env.NEXT_PUBLIC_ENABLE_PUSH_SUBSCRIPTIONS === 'true'
const vapidPublicKey = (process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY ?? '').trim()
const bffBaseUrl = (process.env.NEXT_PUBLIC_BFF_URL ?? '').trim()

const primaryClient: ApiClient = createApiClient(bffBaseUrl || undefined)
const legacyClient: ApiClient = createApiClient()

type SubscriptionMetadata = {
  userAgent?: string
  language?: string
  timezone?: string
}

export type PushSubscriptionState =
  | 'unsupported'
  | 'permission-denied'
  | 'already-subscribed'
  | 'subscribed'
  | 'error'

export type PushUnsubscriptionState =
  | 'unsupported'
  | 'already-unsubscribed'
  | 'unsubscribed'
  | 'error'

export type PushSubscriptionResult = {
  state: PushSubscriptionState
  message?: string
}

export type PushUnsubscriptionResult = {
  state: PushUnsubscriptionState
  message?: string
}

const isPushSupported = () =>
  typeof window !== 'undefined' &&
  'Notification' in window &&
  'serviceWorker' in navigator &&
  'PushManager' in window

const decodeVapidKey = (key: string) => {
  const padding = '='.repeat((4 - (key.length % 4)) % 4)
  const base64 = (key + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

const buildMetadata = (): SubscriptionMetadata => {
  if (typeof window === 'undefined') {
    return {}
  }
  let timezone: string | undefined
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    timezone = undefined
  }
  return {
    userAgent: window.navigator.userAgent,
    language: window.navigator.language,
    timezone,
  }
}

const tryPostSubscription = async (
  subscription: PushSubscription,
  userId: string,
  metadata: SubscriptionMetadata
) => {
  const json = subscription.toJSON()
  const payload = {
    userId,
    endpoint: json.endpoint,
    expirationTime: json.expirationTime ?? null,
    keys: json.keys ?? {},
    metadata,
  }

  try {
    await primaryClient.post('/push/subscribe', payload)
    return
  } catch (error) {
    const shouldFallback =
      !bffBaseUrl &&
      error instanceof ApiError &&
      (error.status === 404 || error.status === 405)

    if (shouldFallback) {
      await legacyClient.post('/api/push/subscribe', payload)
      return
    }

    throw error
  }
}

const tryPostUnsubscribe = async (endpoint: string, userId: string) => {
  try {
    await primaryClient.post('/push/unsubscribe', { userId, endpoint })
    return
  } catch (error) {
    const shouldFallback =
      !bffBaseUrl &&
      error instanceof ApiError &&
      (error.status === 404 || error.status === 405)

    if (shouldFallback) {
      await legacyClient.post('/api/push/unsubscribe', { userId, endpoint })
      return
    }

    throw error
  }
}

export async function ensurePushSubscription(): Promise<PushSubscriptionResult> {
  console.debug('[Push] Flags', {
    isPwaEnabled,
    isPushFeatureEnabled,
    vapidPublicKeyLength: vapidPublicKey.length,
  })

  if (!isPwaEnabled || !isPushFeatureEnabled) {
    return { state: 'unsupported', message: 'Push feature is disabled.' }
  }

  if (!isPushSupported()) {
    return { state: 'unsupported', message: 'Push notifications are not supported on this device.' }
  }

  if (!vapidPublicKey) {
    return { state: 'unsupported', message: 'VAPID public key is not configured.' }
  }

  const applicationServerKey = decodeVapidKey(vapidPublicKey)
  if (applicationServerKey.length !== 65) {
    console.error('[Push] Invalid VAPID public key length', applicationServerKey.length)
    return { state: 'unsupported', message: 'VAPID public key is invalid.' }
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    return { state: 'permission-denied', message: '通知の許可が必要です。' }
  }

  try {
    console.debug('[Push] decoded applicationServerKey', {
      length: applicationServerKey.length,
      firstByte: applicationServerKey[0],
    })
    const registration = await navigator.serviceWorker.ready
    const existingSubscription = await registration.pushManager.getSubscription()
    const { data: sessionData } = await supabase.auth.getSession()
    const userId = sessionData.session?.user?.id
    if (!userId) {
      return {
        state: 'error',
        message: 'ユーザー情報を確認できませんでした。再ログイン後にお試しください。',
      }
    }

    const targetSubscription =
      existingSubscription ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      }))

    await tryPostSubscription(targetSubscription, userId, buildMetadata())

    return {
      state: existingSubscription ? 'already-subscribed' : 'subscribed',
    }
  } catch (error) {
    console.error('Failed to enable push subscription', error)
    return {
      state: 'error',
      message:
        error instanceof Error
          ? error.message
          : 'プッシュ通知の有効化に失敗しました。',
    }
  }
}

export async function disablePushSubscription(): Promise<PushUnsubscriptionResult> {
  if (!isPwaEnabled || !isPushFeatureEnabled) {
    return { state: 'unsupported', message: 'Push feature is disabled.' }
  }

  if (!isPushSupported()) {
    return { state: 'unsupported', message: 'Push notifications are not supported on this device.' }
  }

  const registration = await navigator.serviceWorker.ready
  const existingSubscription = await registration.pushManager.getSubscription()
  const { data: sessionData } = await supabase.auth.getSession()
  const userId = sessionData.session?.user?.id
  if (!userId) {
    return {
      state: 'error',
      message: 'ユーザー情報を確認できませんでした。再ログイン後にお試しください。',
    }
  }

  if (!existingSubscription) {
    return { state: 'already-unsubscribed', message: 'プッシュ通知は既にオフになっています。' }
  }

  try {
    await tryPostUnsubscribe(existingSubscription.endpoint, userId)
  } catch (error) {
    console.error('Failed to unregister subscription on server', error)
    return {
      state: 'error',
      message:
        error instanceof Error
          ? error.message
          : 'サーバーで購読解除に失敗しました。',
    }
  }

  try {
    await existingSubscription.unsubscribe()
  } catch (error) {
    console.warn('Service Worker unsubscribe failed, but server state updated.', error)
  }

  return { state: 'unsubscribed', message: 'プッシュ通知を無効にしました。' }
}
