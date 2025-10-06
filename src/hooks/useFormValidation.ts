import { useState, useCallback } from 'react'

/**
 * フォームバリデーション用のカスタムフック
 * Web標準に準じたバリデーションルールを提供
 */
export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: string) => string | null
}

export interface ValidationErrors {
  [key: string]: string
}

export interface FormField {
  value: string
  error: string
  touched: boolean
}

export interface FormState {
  [key: string]: FormField
}

export const useFormValidation = (initialState: { [key: string]: string }) => {
  const [formState, setFormState] = useState<FormState>(() => {
    const state: FormState = {}
    Object.keys(initialState).forEach(key => {
      state[key] = {
        value: initialState[key],
        error: '',
        touched: false
      }
    })
    return state
  })

  /**
   * バリデーションルールに基づいてエラーメッセージを生成
   */
  const validateField = useCallback((value: string, rules: ValidationRule): string => {
    // 必須チェック
    if (rules.required && !value.trim()) {
      return 'この項目は必須です'
    }

    // 値が空の場合、必須以外のバリデーションはスキップ
    if (!value.trim()) {
      return ''
    }

    // 最小文字数チェック
    if (rules.minLength && value.length < rules.minLength) {
      return `${rules.minLength}文字以上で入力してください`
    }

    // 最大文字数チェック
    if (rules.maxLength && value.length > rules.maxLength) {
      return `${rules.maxLength}文字以下で入力してください`
    }

    // パターンチェック
    if (rules.pattern && !rules.pattern.test(value)) {
      return '入力形式が正しくありません'
    }

    // カスタムバリデーション
    if (rules.custom) {
      const customError = rules.custom(value)
      if (customError) {
        return customError
      }
    }

    return ''
  }, [])

  /**
   * フィールド値を更新
   */
  const updateField = useCallback((fieldName: string, value: string, rules?: ValidationRule) => {
    setFormState(prev => ({
      ...prev,
      [fieldName]: {
        value,
        error: rules ? validateField(value, rules) : '',
        touched: prev[fieldName]?.touched || false
      }
    }))
  }, [validateField])

  /**
   * フィールドをタッチ状態にする（フォーカスアウト時に呼び出し）
   */
  const touchField = useCallback((fieldName: string, rules?: ValidationRule) => {
    setFormState(prev => {
      const currentField = prev[fieldName]
      if (!currentField) return prev

      return {
        ...prev,
        [fieldName]: {
          ...currentField,
          touched: true,
          error: rules ? validateField(currentField.value, rules) : currentField.error
        }
      }
    })
  }, [validateField])

  /**
   * 全フィールドをバリデーション
   */
  const validateAll = useCallback((validationRules: { [key: string]: ValidationRule }) => {
    const errors: ValidationErrors = {}
    let isValid = true

    Object.keys(validationRules).forEach(fieldName => {
      const field = formState[fieldName]
      if (field) {
        const error = validateField(field.value, validationRules[fieldName])
        errors[fieldName] = error
        if (error) {
          isValid = false
        }
      }
    })

    // 全フィールドをタッチ状態にしてエラーを表示
    setFormState(prev => {
      const newState = { ...prev }
      Object.keys(validationRules).forEach(fieldName => {
        if (newState[fieldName]) {
          newState[fieldName] = {
            ...newState[fieldName],
            touched: true,
            error: errors[fieldName] || ''
          }
        }
      })
      return newState
    })

    return { isValid, errors }
  }, [formState, validateField])

  /**
   * フォームをリセット
   */
  const resetForm = useCallback(() => {
    setFormState(prev => {
      const newState: FormState = {}
      Object.keys(prev).forEach(key => {
        newState[key] = {
          value: '',
          error: '',
          touched: false
        }
      })
      return newState
    })
  }, [])

  /**
   * 特定のエラーをクリア
   */
  const clearError = useCallback((fieldName: string) => {
    setFormState(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        error: ''
      }
    }))
  }, [])

  /**
   * 全エラーをクリア
   */
  const clearAllErrors = useCallback(() => {
    setFormState(prev => {
      const newState = { ...prev }
      Object.keys(newState).forEach(key => {
        newState[key] = {
          ...newState[key],
          error: ''
        }
      })
      return newState
    })
  }, [])

  return {
    formState,
    updateField,
    touchField,
    validateAll,
    resetForm,
    clearError,
    clearAllErrors
  }
}

/**
 * 一般的なバリデーションルール
 */
export const validationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value: string) => {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return '有効なメールアドレスを入力してください'
      }
      return null
    }
  },
  password: {
    required: true,
    minLength: 6,
    custom: (value: string) => {
      if (value && value.length < 6) {
        return 'パスワードは6文字以上で入力してください'
      }
      return null
    }
  },
  confirmPassword: (password: string) => ({
    required: true,
    custom: (value: string) => {
      if (value && value !== password) {
        return 'パスワードが一致しません'
      }
      return null
    }
  }),
  name: {
    required: true,
    minLength: 1,
    maxLength: 50
  }
}