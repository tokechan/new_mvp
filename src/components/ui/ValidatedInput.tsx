import React from 'react'
import { Input } from './Input'

/**
 * バリデーション機能付きInputコンポーネント
 * エラーメッセージの表示とスタイリングを統一
 */
export interface ValidatedInputProps {
  label: string
  type?: string
  value: string
  error?: string
  touched?: boolean
  placeholder?: string
  required?: boolean
  disabled?: boolean
  onChange: (value: string) => void
  onBlur?: () => void
  className?: string
  id?: string
}

export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  label,
  type = 'text',
  value,
  error,
  touched,
  placeholder,
  required,
  disabled,
  onChange,
  onBlur,
  className = '',
  id
}) => {
  const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`
  const hasError = touched && error

  return (
    <div className={`space-y-1 ${className}`}>
      <label 
        htmlFor={inputId}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <Input
        id={inputId}
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={`
          ${hasError 
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }
        `}
        aria-invalid={hasError ? 'true' : 'false'}
        aria-describedby={hasError ? `${inputId}-error` : undefined}
      />
      
      {hasError && (
        <p 
          id={`${inputId}-error`}
          className="text-sm text-red-600 flex items-center"
          role="alert"
        >
          <svg 
            className="w-4 h-4 mr-1 flex-shrink-0" 
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
          {error}
        </p>
      )}
    </div>
  )
}