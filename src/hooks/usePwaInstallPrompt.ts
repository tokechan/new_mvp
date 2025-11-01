'use client'

import { useState, useEffect } from 'react'

export type PwaInstallStatus = 
  | 'checking'           // 検出中
  | 'installed'          // 既にインストール済み
  | 'available'          // インストール可能
  | 'not-available'      // 非対応
  | 'prompted'           // ユーザーがプロンプトを閉じた
  | 'error'              // エラー

interface UsePwaInstallPromptReturn {
  status: PwaInstallStatus
  canInstall: boolean
  isInstalled: boolean
  install: () => Promise<void>
  platform: 'ios' | 'android' | 'desktop' | 'unknown'
}

/**
 * PWA インストールプロンプトの状態管理Hook
 * 
 * ブラウザ・OS 別のインストール状態を検出し、
 * インストールプロンプトを表示する
 */
export function usePwaInstallPrompt(): UsePwaInstallPromptReturn {
  const [status, setStatus] = useState<PwaInstallStatus>('checking')
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown')

  // プラットフォーム検出
  useEffect(() => {
    if (typeof window === 'undefined') return

    const userAgent = navigator.userAgent.toLowerCase()
    
    // iOS 検出（Safari のみ、iOS 16.4+）
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios')
      // iOS は standalone モードでない限りインストール不可
      if (window.matchMedia('(display-mode: standalone)').matches || ('standalone' in window.navigator)) {
        setStatus('installed')
      } else {
        setStatus('available')
      }
      return
    }

    // Android 検出
    if (/android/.test(userAgent)) {
      setPlatform('android')
      // スタンドアロンモードかどうか
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setStatus('installed')
      } else {
        setStatus('available')
      }
      return
    }

    // デスクトップ（Chrome, Edge, Firefox）
    setPlatform('desktop')
    
    // スタンドアロンモードかどうか
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setStatus('installed')
    } else {
      setStatus('available')
    }
  }, [])

  // beforeinstallprompt イベントリスナー（Android/Desktop）
  useEffect(() => {
    if (platform !== 'android' && platform !== 'desktop') return
    if (status !== 'available') return

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [platform, status])

  // インストール実行
  const install = async () => {
    if (platform === 'ios') {
      // iOS は手動案内のみ（beforeinstallprompt は非対応）
      return
    }

    if (!deferredPrompt) {
      console.warn('No deferred prompt available')
      return
    }

    try {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        setStatus('installed')
      } else {
        setStatus('prompted')
      }
      
      setDeferredPrompt(null)
    } catch (error) {
      console.error('Installation failed:', error)
      setStatus('error')
    }
  }

  return {
    status,
    canInstall: status === 'available' && (platform === 'android' || platform === 'desktop'),
    isInstalled: status === 'installed',
    install,
    platform,
  }
}

// BeforeInstallPromptEvent の型定義
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

