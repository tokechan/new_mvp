export type PushSubscriptionState =
  | 'unsupported'
  | 'permission-denied'
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
