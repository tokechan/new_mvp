'use client'

import React, { createContext, useContext, useCallback, useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { colors, zIndex } from '@/styles/design-system'

export type ToastVariant = 'success' | 'info' | 'warning' | 'error'

export interface ToastOptions {
  message: string
  variant?: ToastVariant
  durationMs?: number
}

interface ToastContextValue {
  showToast: (opts: ToastOptions) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

interface ToastProviderProps {
  children: React.ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [queue, setQueue] = useState<ToastOptions[]>([])
  const [active, setActive] = useState<ToastOptions | null>(null)

  const showToast = useCallback((opts: ToastOptions) => {
    const next: ToastOptions = {
      variant: 'success',
      durationMs: 2500,
      ...opts,
    }
    setQueue((prev) => [...prev, next])
  }, [])

  useEffect(() => {
    if (!active && queue.length > 0) {
      setActive(queue[0])
      setQueue((prev) => prev.slice(1))
    }
  }, [queue, active])

  useEffect(() => {
    if (!active) return
    const timer = setTimeout(() => setActive(null), active.durationMs || 2500)
    return () => clearTimeout(timer)
  }, [active])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toast={active} />
    </ToastContext.Provider>
  )
}

function getVariantClasses(variant: ToastVariant) {
  switch (variant) {
    case 'success':
      return 'border-green-200 bg-white text-green-700 shadow-sm'
    case 'info':
      return 'border-blue-200 bg-white text-blue-700 shadow-sm'
    case 'warning':
      return 'border-amber-200 bg-white text-amber-700 shadow-sm'
    case 'error':
      return 'border-red-200 bg-white text-red-700 shadow-sm'
    default:
      return 'border-gray-200 bg-white text-gray-700 shadow-sm'
  }
}

function ToastContainer({ toast }: { toast: ToastOptions | null }) {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-0 z-[1700] flex items-end justify-center p-4"
      style={{ zIndex: typeof zIndex.toast === 'number' ? zIndex.toast : 1700 }}
    >
      <div className={cn(
        'transition-all duration-300 ease-out',
        toast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}>
        {toast && (
          <Card className={cn(
            'min-w-[280px] max-w-[92vw] px-4 py-3 border rounded-lg animate-slide-in-right',
            getVariantClasses(toast.variant || 'success')
          )}>
            <div className="text-sm font-medium">
              {toast.message}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}