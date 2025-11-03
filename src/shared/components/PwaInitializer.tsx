'use client'

import { useEffect } from 'react'

const isPwaEnabled = process.env.NEXT_PUBLIC_ENABLE_PWA === 'true'

export default function PwaInitializer() {
  useEffect(() => {
    if (!isPwaEnabled) {
      return
    }
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    let mounted = true

    const registerWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        if (process.env.NODE_ENV !== 'production') {
          console.debug('PWA service worker registered', registration.scope)
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('PWA service worker registration failed', error)
        }
      }
    }

    const onWindowLoad = () => {
      if (!mounted) {
        return
      }
      void registerWorker()
    }

    if (document.readyState === 'complete') {
      void registerWorker()
    } else {
      window.addEventListener('load', onWindowLoad)
    }

    return () => {
      mounted = false
      window.removeEventListener('load', onWindowLoad)
    }
  }, [])

  return null
}
