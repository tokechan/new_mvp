'use client'

import { supabase } from '@/lib/supabase'
import { ApiError, createApiClient } from './apiClient'
import type {
  PushSubscriptionResult,
  PushUnsubscriptionResult,
} from './pushSubscriptionTypes'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const isIOS = () => {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent.toLowerCase()
  const platform = (window.navigator.platform ?? '').toLowerCase()
  return /iphone|ipad|ipod/.test(ua) || /iphone|ipad|ipod/.test(platform)
}

const defaultClient = createApiClient()

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

const arrayBufferToBase64 = (buffer: ArrayBuffer | null | undefined) => {
  if (!buffer) return null
  const bytes = new Uint8Array(buffer)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}

const isInvalidStateError = (error: unknown) =>
  error instanceof DOMException && error.name === 'InvalidStateError'

async function getSubscriptionSafe(registration: ServiceWorkerRegistration, retries = 3) {
  let lastError: unknown = null

  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      return await registration.pushManager.getSubscription()
    } catch (error) {
      lastError = error
      if (!isInvalidStateError(error)) {
        throw error
      }
      console.warn('[PushSafe] getSubscription retry after InvalidStateError', {
        attempt: attempt + 1,
        message: (error as DOMException).message,
      })
      await wait(500)
    }
  }

  if (lastError) {
    if (isInvalidStateError(lastError)) {
      return null
    }
    throw lastError
  }

  return null
}

const snapshotSubscription = (subscription: PushSubscription) => {
  const json = subscription.toJSON?.() ?? null
  const expirationTime = json?.expirationTime ?? null
  let p256dh = json?.keys?.p256dh ?? null
  let auth = json?.keys?.auth ?? null

  if (!p256dh) {
    p256dh = arrayBufferToBase64(subscription.getKey?.('p256dh') ?? null)
  }
  if (!auth) {
    auth = arrayBufferToBase64(subscription.getKey?.('auth') ?? null)
  }

  if (!p256dh || !auth) {
    throw new Error('Push subscription is missing encryption keys.')
  }

  return {
    endpoint: subscription.endpoint,
    expirationTime,
    keys: {
      p256dh,
      auth,
    },
  }
}

const resolveMetadata = () => {
  if (typeof window === 'undefined') return undefined
  return {
    userAgent: window.navigator.userAgent,
    language: window.navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }
}

async function syncSubscription(
  client: ReturnType<typeof createApiClient>,
  subscription: PushSubscription,
  userId: string,
) {
  const snapshot = snapshotSubscription(subscription)

  await client.post('/push/subscribe', {
    userId,
    endpoint: snapshot.endpoint,
    expirationTime: snapshot.expirationTime,
    keys: snapshot.keys,
    metadata: resolveMetadata(),
  })
}

async function purgeExistingSubscription(registration: ServiceWorkerRegistration) {
  let existing: PushSubscription | null
  try {
    existing = await getSubscriptionSafe(registration)
  } catch (error) {
    console.warn('[PushSafe] getSubscription failed while purging', error)
    throw error
  }
  if (!existing) {
    console.debug('[PushSafe] No subscription to purge')
    return null
  }

  for (let attempt = 0; attempt < 3 && existing; attempt += 1) {
    try {
      const unsubscribed = await existing.unsubscribe()
      console.debug('[PushSafe] Unsubscribe attempt', attempt + 1, unsubscribed)
    } catch (error) {
      console.warn('[PushSafe] Unsubscribe attempt failed', attempt + 1, error)
    }
    await wait(500)
    try {
      existing = await getSubscriptionSafe(registration)
    } catch (error) {
      console.warn('[PushSafe] getSubscription failed during purge retry', error)
      existing = null
    }
  }

  if (existing) {
    console.warn('[PushSafe] Subscription still exists after purge attempts')
  } else {
    console.debug('[PushSafe] Subscription successfully purged')
  }

  return existing
}

export async function ensurePushSubscriptionSafe(
  vapidPublicKey: string,
  bffBaseUrl?: string,
 ): Promise<PushSubscriptionResult> {
  console.debug('[PushSafe] Start')

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { state: 'unsupported', message: 'Push not supported in this browser.' }
  }

  if (!('Notification' in window)) {
    return { state: 'unsupported', message: 'Notification API not available.' }
  }

  if (!vapidPublicKey) {
    return { state: 'unsupported', message: 'VAPID public key is not configured.' }
  }

  if (Notification.permission === 'denied') {
    return { state: 'permission-denied', message: '通知の許可が必要です。' }
  }

  if (Notification.permission === 'default') {
    const permissionResult = await Notification.requestPermission()
    if (permissionResult !== 'granted') {
      return { state: 'permission-denied', message: '通知の許可が必要です。' }
    }
  }

  const { data: sessionData } = await supabase.auth.getSession()
  const userId = sessionData.session?.user?.id
  if (!userId) {
    return { state: 'error', message: 'ユーザー情報が取得できませんでした。' }
  }

  const client = bffBaseUrl ? createApiClient(bffBaseUrl) : defaultClient

  const registration = await navigator.serviceWorker.ready
  let existing: PushSubscription | null = null
  try {
    existing = await getSubscriptionSafe(registration)
  } catch (error) {
    if (isInvalidStateError(error)) {
      console.warn('[PushSafe] getSubscription failed before sync due to InvalidStateError')
    } else {
      console.error('[PushSafe] getSubscription failed before sync', error)
      return {
        state: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'プッシュ通知の状態取得に失敗しました。時間を置いて再試行してください。',
      }
    }
  }

  if (existing) {
    try {
      await syncSubscription(client, existing, userId)
      console.debug('[PushSafe] Reused existing subscription', existing.endpoint)
      return { state: 'subscribed', message: 'プッシュ通知を有効化しました。' }
    } catch (error) {
      console.warn('[PushSafe] Failed to sync existing subscription, will retry with fresh subscribe', error)
      try {
        existing = await purgeExistingSubscription(registration)
      } catch (purgeError) {
        console.error('[PushSafe] Failed to purge subscription after sync failure', purgeError)
        return {
          state: 'error',
          message:
            purgeError instanceof Error
              ? purgeError.message
              : '既存のプッシュ購読を解除できませんでした。時間を置いて再試行してください。',
        }
      }

      if (existing) {
        return {
          state: 'error',
          message:
            '既存のプッシュ購読を更新できませんでした。ブラウザの通知設定をリセットして再試行してください。',
        }
      }
    }
  }

  if (isIOS()) {
    await wait(1000)
  }

  const applicationServerKey = decodeVapidKey(vapidPublicKey)
  if (!(applicationServerKey instanceof Uint8Array) || applicationServerKey.length !== 65) {
    console.error('[PushSafe] invalid VAPID key length', applicationServerKey.length)
    return { state: 'unsupported', message: 'VAPID public key is invalid.' }
  }
  console.debug('[PushSafe] VAPID key decoded', {
    length: applicationServerKey.length,
    firstByte: applicationServerKey[0],
    lastByte: applicationServerKey[applicationServerKey.length - 1],
  })

  try {
    const keyForSubscribe: BufferSource = isIOS()
      ? applicationServerKey.buffer.slice(0)
      : applicationServerKey

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: keyForSubscribe,
    })

    await syncSubscription(client, subscription, userId)
    console.debug('[PushSafe] subscription created', subscription.endpoint)

    return { state: 'subscribed', message: 'プッシュ通知を有効化しました。' }
  } catch (error) {
    console.error('[PushSafe] subscribe failed', error)

    if (isIOS() && error instanceof DOMException && error.name === 'InvalidAccessError') {
      console.warn('[PushSafe] retry subscribe with Uint8Array fallback for iOS InvalidAccessError')
      try {
        const fallbackSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: new Uint8Array(applicationServerKey),
        })
        await syncSubscription(client, fallbackSubscription, userId)
        console.debug('[PushSafe] subscription created via fallback', fallbackSubscription.endpoint)
        return { state: 'subscribed', message: 'プッシュ通知を有効化しました。' }
      } catch (fallbackError) {
        console.error('[PushSafe] fallback subscribe failed', fallbackError)
      }
    }

    if (error instanceof ApiError) {
      return {
        state: 'error',
        message: error.message ?? 'プッシュ通知の有効化に失敗しました。',
      }
    }

    if (error instanceof DOMException && error.name === 'InvalidStateError') {
      return {
        state: 'error',
        message:
          '既に別のプッシュ購読が存在するため再登録できませんでした。通知設定をリセット後に再試行してください。',
      }
    }

    return {
      state: 'error',
      message: error instanceof Error ? error.message : 'プッシュ通知の有効化に失敗しました。',
    }
  }
}

export async function disablePushSubscriptionSafe(
  bffBaseUrl?: string,
): Promise<PushUnsubscriptionResult> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { state: 'unsupported', message: 'Push not supported in this browser.' }
  }

  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  const { data: sessionData } = await supabase.auth.getSession()
  const userId = sessionData.session?.user?.id

  if (!userId) {
    return { state: 'error', message: 'ユーザー情報が取得できませんでした。' }
  }

  if (!subscription) {
    return { state: 'already-unsubscribed', message: 'プッシュ通知は既にオフになっています。' }
  }

  try {
    const client = bffBaseUrl ? createApiClient(bffBaseUrl) : defaultClient
    await client.post('/push/unsubscribe', {
      userId,
      endpoint: subscription.endpoint,
    })
    const result = await subscription.unsubscribe()
    console.debug('[PushSafe] unsubscribe result', result)

    return { state: 'unsubscribed', message: 'プッシュ通知を無効にしました。' }
  } catch (error) {
    console.error('[PushSafe] unsubscribe failed', error)
    return {
      state: 'error',
      message: error instanceof Error ? error.message : 'プッシュ通知の無効化に失敗しました。',
    }
  }
}
