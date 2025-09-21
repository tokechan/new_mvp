/**
 * アクセシブルなButtonコンポーネント
 * WCAG 2.1 AA準拠、キーボードナビゲーション対応
 */

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

// ボタンのバリアント定義
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** ボタンのバリアント */
  variant?: ButtonVariant;
  /** ボタンのサイズ */
  size?: ButtonSize;
  /** ローディング状態 */
  loading?: boolean;
  /** 左側のアイコン */
  leftIcon?: React.ReactNode;
  /** 右側のアイコン */
  rightIcon?: React.ReactNode;
  /** フルワイドかどうか */
  fullWidth?: boolean;
  /** 子要素 */
  children: React.ReactNode;
}

/**
 * バリアント別のスタイルクラス
 */
const variantClasses: Record<ButtonVariant, string> = {
  primary: `
    bg-blue-600 text-white border-blue-600
    hover:bg-blue-700 hover:border-blue-700
    focus:ring-blue-500
    disabled:bg-blue-300 disabled:border-blue-300
  `,
  secondary: `
    bg-gray-600 text-white border-gray-600
    hover:bg-gray-700 hover:border-gray-700
    focus:ring-gray-500
    disabled:bg-gray-300 disabled:border-gray-300
  `,
  outline: `
    bg-transparent text-blue-600 border-blue-600
    hover:bg-blue-50 hover:text-blue-700
    focus:ring-blue-500
    disabled:text-blue-300 disabled:border-blue-300
  `,
  ghost: `
    bg-transparent text-gray-700 border-transparent
    hover:bg-gray-100 hover:text-gray-900
    focus:ring-gray-500
    disabled:text-gray-300
  `,
  destructive: `
    bg-red-600 text-white border-red-600
    hover:bg-red-700 hover:border-red-700
    focus:ring-red-500
    disabled:bg-red-300 disabled:border-red-300
  `
};

/**
 * サイズ別のスタイルクラス
 */
const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm min-h-[32px]',
  md: 'px-4 py-2 text-base min-h-[40px]',
  lg: 'px-6 py-3 text-lg min-h-[48px]'
};

/**
 * 基本スタイルクラス
 */
const baseClasses = `
  inline-flex items-center justify-center
  font-medium rounded-md border
  transition-all duration-200 ease-in-out
  focus:outline-none focus:ring-2 focus:ring-offset-2
  disabled:cursor-not-allowed disabled:opacity-50
  select-none
`;

/**
 * ローディングスピナーコンポーネント
 */
const LoadingSpinner: React.FC<{ size: ButtonSize }> = ({ size }) => {
  const spinnerSize = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }[size];

  return (
    <svg
      className={cn('animate-spin', spinnerSize)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

/**
 * アクセシブルなButtonコンポーネント
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      disabled,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    // ローディング中またはdisabled状態の判定
    const isDisabled = disabled || loading;

    // アイコンとテキストの間隔
    const iconSpacing = {
      sm: 'gap-1.5',
      md: 'gap-2',
      lg: 'gap-2.5'
    }[size];

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          iconSpacing,
          fullWidth && 'w-full',
          className
        )}
        // アクセシビリティ属性
        aria-disabled={isDisabled}
        aria-busy={loading}
        {...props}
      >
        {/* 左側のアイコンまたはローディングスピナー */}
        {loading ? (
          <LoadingSpinner size={size} />
        ) : (
          leftIcon && (
            <span className="flex-shrink-0" aria-hidden="true">
              {leftIcon}
            </span>
          )
        )}

        {/* ボタンテキスト */}
        <span className={loading ? 'opacity-70' : ''}>
          {children}
        </span>

        {/* 右側のアイコン（ローディング中は非表示） */}
        {!loading && rightIcon && (
          <span className="flex-shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

// 使用例とストーリー用のエクスポート
export type { ButtonProps, ButtonVariant, ButtonSize };