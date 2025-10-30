'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Smile, ThumbsUp, Heart, Handshake, Flame } from 'lucide-react'

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

  // 絵文字抽出とテーマ判定
  const EMOJI_ORDER = ['😊', '👍', '❤️', '🙏', '🔥'] as const
  const extractPrimaryEmoji = (msg: string) => {
    const s = (msg || '').trim()
    for (const e of EMOJI_ORDER) {
      if (s.includes(e)) return e
    }
    // 先頭が絵文字のケースにも対応
    const first = s.charAt(0)
    return EMOJI_ORDER.includes(first as any) ? (first as (typeof EMOJI_ORDER)[number]) : null
  }
  const deriveThemeFromEmoji = (emoji: string | null) => {
    switch (emoji) {
      case '😊':
        return 'yellow'
      case '👍':
        return 'blue'
      case '❤️':
        return 'pink'
      case '🙏':
        return 'purple'
      case '🔥':
        return 'orange'
      default:
        return 'multi'
    }
  }

  const primaryEmoji = extractPrimaryEmoji(message)
  const theme = deriveThemeFromEmoji(primaryEmoji)

  // 背景グラデーションのクラス（Tailwind のパージ回避のため列挙）
  const themeGradient: Record<string, string> = {
    multi: 'bg-gradient-to-br from-yellow-100 via-pink-100 to-primary/10',
    yellow: 'bg-gradient-to-br from-yellow-50/40 via-amber-100/50 to-orange-50/40',
    blue: 'bg-gradient-to-br from-primary/40 via-primary/30 to-primary/50',
    pink: 'bg-gradient-to-br from-pink-50/40 via-rose-100/50 to-fuchsia-50/40',
    purple: 'bg-gradient-to-br from-purple-50/40 via-violet-100/50 to-fuchsia-50/40',
    orange: 'bg-gradient-to-br from-orange-50/40 via-amber-100/50 to-yellow-50/40',
  }


  // メッセージ表示用：プレフィックス除去＋絵文字除去（ES5互換）
  const sanitizedMessage = sanitizePartnerMessage(message)

  // アイコンのアクセントカラー（テーマに調和）
  const iconAccentTone: Record<string, string> = {
    multi: 'text-pink-600',
    yellow: 'text-amber-500',
    blue: 'text-primary',
    pink: 'text-pink-600',
    purple: 'text-violet-600',
    orange: 'text-orange-500',
  }
  const iconAccentClass = iconAccentTone[theme] || iconAccentTone.multi
  // アイコン背景色（透明度を50%にしてガラス感を演出）
  const iconBackgroundTone: Record<string, string> = {
    multi: 'bg-pink-300/30',
    yellow: 'bg-amber-300/30',
    blue: 'bg-primary/30',
    pink: 'bg-pink-300/30',
    purple: 'bg-violet-300/30',
    orange: 'bg-orange-300/30',
  }
  const iconBackgroundClass = iconBackgroundTone[theme] || iconBackgroundTone.multi
  // 閉じるボタン背景色（テーマに調和する同系色・彩度控えめ）
  const buttonBgTone: Record<string, string> = {
    multi: 'bg-pink-300',
    yellow: 'bg-amber-300',
    blue: 'bg-primary',
    pink: 'bg-pink-300',
    purple: 'bg-violet-300',
    orange: 'bg-orange-300',
  }
  const buttonHoverTone: Record<string, string> = {
    multi: 'hover:bg-pink-400',
    yellow: 'hover:bg-amber-400',
    blue: 'hover:bg-primary/90',
    pink: 'hover:bg-pink-400',
    purple: 'hover:bg-violet-400',
    orange: 'hover:bg-orange-400',
  }
  const buttonRingTone: Record<string, string> = {
    multi: 'focus:ring-pink-300',
    yellow: 'focus:ring-amber-300',
    blue: 'focus:ring-primary',
    pink: 'focus:ring-pink-300',
    purple: 'focus:ring-violet-300',
    orange: 'focus:ring-orange-300',
  }

  // コンフェッティの配色をテーマに合わせる
  const confettiPalette: Record<string, string[]> = {
    multi: ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#B28DFF'],
    yellow: ['#FDE68A', '#FCD34D', '#FBBF24', '#FB923C', '#FEF3C7'],
    blue: ['#93C5FD', '#60A5FA', '#3B82F6', '#22D3EE', '#A5B4FC'],
    pink: ['#FBCFE8', '#F472B6', '#FB7185', '#EC4899', '#FECDD3'],
    purple: ['#D8B4FE', '#C084FC', '#A78BFA', '#F472B6', '#9333EA'],
    orange: ['#FED7AA', '#FDBA74', '#FB923C', '#F59E0B', '#FCD34D'],
  }

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

    const colors = confettiPalette[theme] || confettiPalette.multi
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
  }, [open, durationMs, theme])

  if (!open) return null

  return createPortal(
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center ${themeGradient[theme]}`}
      role="dialog"
      aria-modal="true"
      aria-label="ありがとうのお祝い"
    >
      {/* コンフェッティ */}
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* 中央アイコン +（アニメーション後に）メッセージ表示 */}
      <div className="relative z-10 text-center px-6 max-w-3xl">
        <div className={`flex justify-center mb-2`}>
          <div className={`rounded-full p-6 sm:p-7 md:p-8 backdrop-blur-md ${iconBackgroundClass}`}>
            {primaryEmoji === '😊' && <Smile className={`w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 ${iconAccentClass}`} aria-hidden="true" />}
            {primaryEmoji === '👍' && <ThumbsUp className={`w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 ${iconAccentClass}`} aria-hidden="true" />}
            {primaryEmoji === '❤️' && <Heart className={`w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 ${iconAccentClass}`} aria-hidden="true" />}
            {primaryEmoji === '🙏' && <Handshake className={`w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 ${iconAccentClass}`} aria-hidden="true" />}
            {primaryEmoji === '🔥' && <Flame className={`w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 ${iconAccentClass}`} aria-hidden="true" />}
            {!primaryEmoji && <Heart className={`w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 ${iconAccentClass}`} aria-hidden="true" />}
          </div>
        </div>
        {showMessage && (
          <p className="font-extrabold text-2xl sm:text-3xl md:text-4xl text-neutral-600 tracking-tight leading-tight whitespace-pre-wrap break-words">
            メッセージ：{sanitizedMessage}
          </p>
        )}
        {showMessage && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={onClose}
              className={`h-12 w-12 rounded-full p-0 grid place-items-center ${buttonBgTone[theme]} shadow-md ${buttonHoverTone[theme]} focus:outline-none focus:ring-2 ${buttonRingTone[theme]}`}
              aria-label="閉じる"
            >
              <X className="w-6 h-6 text-white" aria-hidden="true" />
              <span className="sr-only">閉じる</span>
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}




// 絵文字やプレフィックスを除去するヘルパー
function sanitizePartnerMessage(input: string): string {
  const src = input || ''
  // 先頭の「◯◯から:」または「◯◯から：」を除去（ES5互換）
  const withoutPrefix = src.replace(/^\s*[^:：]+から[:：]\s*/, '')
  // 絵文字を構成するサロゲートペア、VS(\uFE0F)、ZWJ(\u200D)、BMP絵文字領域（Misc Symbols, Dingbats 等）も除去（ES5互換）
  const noEmoji = withoutPrefix.replace(/[\uD800-\uDBFF\uDC00-\uDFFF]|\uFE0F|\u200D|[\u2600-\u26FF\u2700-\u27BF]/g, '')
  // 連続スペースを1つにまとめる
  return noEmoji.replace(/\s{2,}/g, ' ').trim()
}
