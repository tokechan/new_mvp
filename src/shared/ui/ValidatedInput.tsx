import React from 'react'
import { Input } from './Input'
import { AlertCircle } from 'lucide-react'

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
        className="block text-sm font-medium text-muted-foreground"
      >
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
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
            ? 'border-destructive focus:border-destructive focus:ring-destructive' 
            : 'border-border focus:border-primary focus:ring-primary'
          }
        `}
        aria-invalid={hasError ? 'true' : 'false'}
        aria-describedby={hasError ? `${inputId}-error` : undefined}
      />
      
      {hasError && (
        <p 
          id={`${inputId}-error`}
          className="text-sm text-destructive flex items-center"
          role="alert"
        >
          <AlertCircle 
            className="w-4 h-4 mr-1 flex-shrink-0" 
            aria-hidden="true"
          />
          {error}
        </p>
      )}
    </div>
  )
}
