import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * フォーカス可能な要素を取得するヘルパー関数
 * アクセシビリティ対応のキーボードナビゲーションで使用
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])'
  ].join(', ')
  
  return Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[]
}

/**
 * null/undefined を境界で統一して undefined に正規化する
 * 型安全にアプリ内部の条件分岐を最小化するためのヘルパー
 */
export function normalizeNullable<T>(value: T | null | undefined): T | undefined {
  return value ?? undefined
}

export function normalizeNumericId(value: string | number | null | undefined): number | undefined {
  if (value === null || value === undefined) return undefined
  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.trunc(value) : undefined
  }
  const trimmed = value.trim()
  if (!/^[0-9]+$/.test(trimmed)) return undefined
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : undefined
}
