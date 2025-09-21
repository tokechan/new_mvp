/**
 * アクセシブルなInputコンポーネント
 * WCAG 2.1 AA準拠、フォームバリデーション対応
 */

import React, { forwardRef, useState, useId } from 'react';
import { cn } from '@/lib/utils';

// 入力フィールドのバリアント定義
type InputVariant = 'default' | 'error' | 'success';
type InputSize = 'sm' | 'md' | 'lg';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** 入力フィールドのバリアント */
  variant?: InputVariant;
  /** 入力フィールドのサイズ */
  size?: InputSize;
  /** ラベルテキスト */
  label?: string;
  /** ヘルプテキスト */
  helpText?: string;
  /** エラーメッセージ */
  errorMessage?: string;
  /** 成功メッセージ */
  successMessage?: string;
  /** 左側のアイコン */
  leftIcon?: React.ReactNode;
  /** 右側のアイコン */
  rightIcon?: React.ReactNode;
  /** フルワイドかどうか */
  fullWidth?: boolean;
  /** ラベルを非表示にするか（アクセシビリティのためaria-labelは残る） */
  hideLabel?: boolean;
}

/**
 * バリアント別のスタイルクラス
 */
const variantClasses: Record<InputVariant, string> = {
  default: `
    border-gray-300 text-gray-900
    focus:border-blue-500 focus:ring-blue-500
    hover:border-gray-400
  `,
  error: `
    border-red-300 text-gray-900
    focus:border-red-500 focus:ring-red-500
    hover:border-red-400
  `,
  success: `
    border-green-300 text-gray-900
    focus:border-green-500 focus:ring-green-500
    hover:border-green-400
  `
};

/**
 * サイズ別のスタイルクラス
 */
const sizeClasses: Record<InputSize, string> = {
  sm: 'px-3 py-1.5 text-sm min-h-[32px]',
  md: 'px-4 py-2 text-base min-h-[40px]',
  lg: 'px-4 py-3 text-lg min-h-[48px]'
};

/**
 * 基本スタイルクラス
 */
const baseClasses = `
  block w-full rounded-md border
  bg-white shadow-sm
  transition-all duration-200 ease-in-out
  focus:outline-none focus:ring-2 focus:ring-offset-0
  disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500
  placeholder:text-gray-400
`;

/**
 * ラベルのスタイルクラス
 */
const labelClasses = `
  block text-sm font-medium text-gray-700 mb-1
`;

/**
 * ヘルプテキストのスタイルクラス
 */
const helpTextClasses = `
  mt-1 text-sm text-gray-600
`;

/**
 * エラーメッセージのスタイルクラス
 */
const errorMessageClasses = `
  mt-1 text-sm text-red-600 flex items-center gap-1
`;

/**
 * 成功メッセージのスタイルクラス
 */
const successMessageClasses = `
  mt-1 text-sm text-green-600 flex items-center gap-1
`;

/**
 * エラーアイコンコンポーネント
 */
const ErrorIcon: React.FC = () => (
  <svg
    className="w-4 h-4 flex-shrink-0"
    fill="currentColor"
    viewBox="0 0 20 20"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
      clipRule="evenodd"
    />
  </svg>
);

/**
 * 成功アイコンコンポーネント
 */
const SuccessIcon: React.FC = () => (
  <svg
    className="w-4 h-4 flex-shrink-0"
    fill="currentColor"
    viewBox="0 0 20 20"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
      clipRule="evenodd"
    />
  </svg>
);

/**
 * アクセシブルなInputコンポーネント
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = 'default',
      size = 'md',
      label,
      helpText,
      errorMessage,
      successMessage,
      leftIcon,
      rightIcon,
      fullWidth = true,
      hideLabel = false,
      className,
      id,
      ...props
    },
    ref
  ) => {
    // 一意のIDを生成（propsで指定されていない場合）
    const generatedId = useId();
    const inputId = id || generatedId;
    
    // ヘルプテキストとエラーメッセージのID
    const helpTextId = helpText ? `${inputId}-help` : undefined;
    const errorMessageId = errorMessage ? `${inputId}-error` : undefined;
    const successMessageId = successMessage ? `${inputId}-success` : undefined;
    
    // バリアントの自動判定
    const currentVariant = errorMessage ? 'error' : successMessage ? 'success' : variant;
    
    // aria-describedbyの構築
    const describedBy = [
      helpTextId,
      errorMessageId,
      successMessageId
    ].filter(Boolean).join(' ') || undefined;

    // アイコンとの間隔調整
    const iconSpacing = {
      sm: leftIcon ? 'pl-9' : rightIcon ? 'pr-9' : '',
      md: leftIcon ? 'pl-10' : rightIcon ? 'pr-10' : '',
      lg: leftIcon ? 'pl-12' : rightIcon ? 'pr-12' : ''
    }[size];

    const iconSize = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6'
    }[size];

    const iconPosition = {
      sm: leftIcon ? 'left-3' : 'right-3',
      md: leftIcon ? 'left-3' : 'right-3',
      lg: leftIcon ? 'left-4' : 'right-4'
    }[size];

    return (
      <div className={cn('relative', fullWidth ? 'w-full' : 'w-auto')}>
        {/* ラベル */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              labelClasses,
              hideLabel && 'sr-only'
            )}
          >
            {label}
          </label>
        )}

        {/* 入力フィールドコンテナ */}
        <div className="relative">
          {/* 左側のアイコン */}
          {leftIcon && (
            <div className={cn(
              'absolute inset-y-0 left-0 flex items-center pointer-events-none',
              iconPosition
            )}>
              <span className={cn('text-gray-400', iconSize)} aria-hidden="true">
                {leftIcon}
              </span>
            </div>
          )}

          {/* 入力フィールド */}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              baseClasses,
              variantClasses[currentVariant],
              sizeClasses[size],
              iconSpacing,
              className
            )}
            aria-describedby={describedBy}
            aria-invalid={errorMessage ? 'true' : 'false'}
            {...props}
          />

          {/* 右側のアイコン */}
          {rightIcon && (
            <div className={cn(
              'absolute inset-y-0 right-0 flex items-center pointer-events-none',
              iconPosition
            )}>
              <span className={cn('text-gray-400', iconSize)} aria-hidden="true">
                {rightIcon}
              </span>
            </div>
          )}
        </div>

        {/* ヘルプテキスト */}
        {helpText && !errorMessage && !successMessage && (
          <p id={helpTextId} className={helpTextClasses}>
            {helpText}
          </p>
        )}

        {/* エラーメッセージ */}
        {errorMessage && (
          <p id={errorMessageId} className={errorMessageClasses} role="alert">
            <ErrorIcon />
            {errorMessage}
          </p>
        )}

        {/* 成功メッセージ */}
        {successMessage && (
          <p id={successMessageId} className={successMessageClasses}>
            <SuccessIcon />
            {successMessage}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// 使用例とストーリー用のエクスポート
export type { InputProps, InputVariant, InputSize };