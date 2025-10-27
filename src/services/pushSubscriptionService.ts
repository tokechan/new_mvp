'use client'

import { apiClient } from './apiClient'

const isPwaEnabled = process.env.NEXT_PUBLIC_ENABLE_PWA === 'true'
const isPushFeatureEnabled = process.env.NEXT_PUBLIC_ENABLE_PUSH_SUBSCRIPTIONS === 'true'
const vapidPublicKey = (process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY ?? '').trim()

export type PushSubscriptionState =
  | 'unsupported'
  | 'permission-denied'
  | 'already-subscribed'
  | 'subscribed'

export type PushUnsubscriptionState =
  | 'unsupported'
  | 'already-unsubscribed'
  | 'unsubscribed'

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

const postSubscription = async (subscription: PushSubscription) => {
  const json = subscription.toJSON()
  return apiClient.post('/api/push/subscribe', {
    endpoint: json.endpoint,
    expirationTime: json.expirationTime ?? null,
    keys: json.keys ?? {},
  })
}

const postUnsubscribe = async (endpoint: string) => {
  return apiClient.post('/api/push/unsubscribe', { endpoint })
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

  const registration = await navigator.serviceWorker.ready
  const existingSubscription = await registration.pushManager.getSubscription()

  const targetSubscription =
    existingSubscription ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    }))

  await postSubscription(targetSubscription)

  return {
    state: existingSubscription ? 'already-subscribed' : 'subscribed',
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

  if (!existingSubscription) {
    return { state: 'already-unsubscribed', message: 'プッシュ通知は既にオフになっています。' }
  }

  try {
    await postUnsubscribe(existingSubscription.endpoint)
  } catch (error) {
    console.error('Failed to unregister subscription on server', error)
    return { state: 'unsupported', message: 'サーバーで購読解除に失敗しました。' }
  }

  try {
    await existingSubscription.unsubscribe()
  } catch (error) {
    console.warn('Service Worker unsubscribe failed, but server state updated.', error)
  }

  return { state: 'unsubscribed', message: 'プッシュ通知を無効にしました。' }
}
