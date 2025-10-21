'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, PartyPopper } from 'lucide-react'

interface ThankYouCelebrationProps {
  /** 表示状態 */
  open: boolean
  /** 感謝メッセージ本文 */
  message: string
  /** 閉じる */
  onClose: () => void
  /** アニメーション継続時間(ms) */
  durationMs?: number
}

/**
 * ありがとうのフルスクリーン祝福オーバーレイ
 * - 画面全体にクラッカーのような派手なコンフェッティ
 * - アニメーション終了後はメッセージを中央に大きく表示
 * - アバターは表示しない
 */
export default function ThankYouCelebration({
  open,
  message,
  onClose,
  durationMs = 1800,
}: ThankYouCelebrationProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const [showMessage, setShowMessage] = useState(false)

  // パーティクル型
  type Particle = {
    x: number
    y: number
    vx: number
    vy: number
    color: string
    size: number
    rotation: number
    rotationSpeed: number
    shape: 'rect' | 'circle' | 'triangle'
  }

  useEffect(() => {
    if (!open) return

    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()

    const colors = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#B28DFF']
    const particles: Particle[] = []

    const spawnBurst = (count = 160) => {
      const cx = canvas.width / 2
      const cy = canvas.height / 2
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2
        const speed = 4 + Math.random() * 6
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: colors[(Math.random() * colors.length) | 0],
          size: 3 + Math.random() * 6,
          rotation: Math.random() * Math.PI,
          rotationSpeed: (Math.random() - 0.5) * 0.2,
          shape: ['rect', 'circle', 'triangle'][(Math.random() * 3) | 0] as Particle['shape'],
        })
      }
    }

    const gravity = 0.12
    const friction = 0.985

    const draw = (p: Particle) => {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      ctx.fillStyle = p.color
      switch (p.shape) {
        case 'rect':
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
          break
        case 'circle':
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
          break
        case 'triangle':
          ctx.beginPath()
          ctx.moveTo(-p.size / 2, p.size / 2)
          ctx.lineTo(0, -p.size / 2)
          ctx.lineTo(p.size / 2, p.size / 2)
          ctx.closePath()
          ctx.fill()
          break
      }
      ctx.restore()
    }

    const step = (ts: number) => {
      if (!startTimeRef.current) startTimeRef.current = ts
      const elapsed = ts - startTimeRef.current

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 更新
      particles.forEach((p) => {
        p.vx *= friction
        p.vy = p.vy * friction + gravity
        p.x += p.vx
        p.y += p.vy
        p.rotation += p.rotationSpeed
      })

      // 画面外を適当に再配置して長く降らせる
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        if (p.y - p.size > canvas.height) {
          p.y = -10
          p.vy = 2 + Math.random() * 2
          p.x = Math.random() * canvas.width
          p.vx = (Math.random() - 0.5) * 2
        }
      }

      // 描画
      particles.forEach(draw)

      if (elapsed < durationMs) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        // アニメーションが終わったらメッセージのみ表示に切り替え
        setShowMessage(true)
      }
    }

    spawnBurst()
    window.addEventListener('resize', resize)
    rafRef.current = requestAnimationFrame(step)

    return () => {
      window.removeEventListener('resize', resize)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      startTimeRef.current = 0
      setShowMessage(false)
      const c = canvasRef.current
      if (c) {
        const ctx2 = c.getContext('2d')
        ctx2?.clearRect(0, 0, c.width, c.height)
      }
    }
  }, [open, durationMs])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-yellow-100 via-pink-100 to-blue-100"
      role="dialog"
      aria-modal="true"
      aria-label="ありがとうのお祝い"
    >
      {/* コンフェッティ */}
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* 中央メッセージ */}
      <div className="relative z-10 text-center px-6 max-w-3xl">
        <div className="inline-flex items-center justify-center mb-6 animate-pop-burst">
          <PartyPopper className="w-16 h-16 text-pink-600" aria-hidden="true" />
        </div>
        <p className="font-extrabold text-3xl sm:text-4xl md:text-5xl text-gray-900 tracking-tight leading-tight">
          {message}
        </p>
        {showMessage && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-pink-600 text-white shadow-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-400"
              aria-label="閉じる"
            >
              <X className="w-5 h-5" aria-hidden="true" />
              閉じる
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}