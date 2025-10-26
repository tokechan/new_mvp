'use client'

import { apiClient } from './apiClient'

const isPwaEnabled = process.env.NEXT_PUBLIC_ENABLE_PWA === 'true'
const isPushFeatureEnabled = process.env.NEXT_PUBLIC_ENABLE_PUSH_SUBSCRIPTIONS === 'true'
const vapidPublicKey = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY ?? ''

export type PushSubscriptionState =
  | 'unsupported'
  | 'permission-denied'
  | 'already-subscribed'
  | 'subscribed'

export type PushSubscriptionResult = {
  state: PushSubscriptionState
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
  return apiClient.post('/push/subscribe', {
    endpoint: json.endpoint,
    expirationTime: json.expirationTime ?? null,
    keys: json.keys ?? {},
  })
}

export async function ensurePushSubscription(): Promise<PushSubscriptionResult> {
  if (!isPwaEnabled || !isPushFeatureEnabled) {
    return { state: 'unsupported', message: 'Push feature is disabled.' }
  }

  if (!isPushSupported()) {
    return { state: 'unsupported', message: 'Push notifications are not supported on this device.' }
  }

  if (!vapidPublicKey) {
    return { state: 'unsupported', message: 'VAPID public key is not configured.' }
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
      applicationServerKey: decodeVapidKey(vapidPublicKey),
    }))

  await postSubscription(targetSubscription)

  return {
    state: existingSubscription ? 'already-subscribed' : 'subscribed',
  }
}
