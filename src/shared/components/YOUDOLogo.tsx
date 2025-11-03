import React from 'react'

export type YOUDOLogoProps = {
  width?: number
  height?: number
  textColor?: string // YOUのテキスト色
  accentColor?: string // DOの背景色
  className?: string
}

/**
 * YOUDOロゴコンポーネント
 * - YOUテキストの色は `textColor`
 * - DOの背景色は `accentColor`
 * - サイズは `width` / `height`
 */
export function YOUDOLogo({
  width = 100,
  height = 36,
  textColor = '#5a4a42',
  accentColor = '#9BC4C4',
  className,
}: YOUDOLogoProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 36"
      role="img"
      aria-label="YOUDO ロゴ"
      preserveAspectRatio="xMidYMid meet"
      className={className}
    >
      <title>YOUDO</title>
      {/* YOU */}
      <text
        x={4}
        y={24}
        fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
        fontSize={18}
        fontWeight={700}
        fill={textColor}
        letterSpacing={1}
      >
        YOU
      </text>

      {/* DO 背景 */}
      <rect x={46} y={6} rx={8} ry={8} width={38} height={24} fill={accentColor} />

      {/* DO テキスト（背景上に白文字）*/}
      <text
        x={65}
        y={24}
        fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
        fontSize={16}
        fontWeight={800}
        fill="#ffffff"
        textAnchor="middle"
        letterSpacing={0.5}
      >
        DO
      </text>
    </svg>
  )
}