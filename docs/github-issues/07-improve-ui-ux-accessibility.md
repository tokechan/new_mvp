# 🎨 UI/UXの改善とアクセシビリティ対応

## 機能概要

ユーザビリティの向上とアクセシビリティ基準への対応を行い、より使いやすいアプリケーションを実現する。

## 現在の課題

### UI/UX課題
- [ ] 一貫性のないデザインシステム
- [ ] レスポンシブデザインの不備
- [ ] ローディング状態の不明確さ
- [ ] エラーメッセージの分かりにくさ
- [ ] ユーザーフィードバックの不足

### アクセシビリティ課題
- [ ] キーボードナビゲーションの不備
- [ ] スクリーンリーダー対応の不足
- [ ] 色のコントラスト不足
- [ ] フォーカス管理の問題
- [ ] ARIAラベルの不足

## 解決策

### Phase 1: デザインシステムの構築
- [ ] カラーパレットの統一
- [ ] タイポグラフィの標準化
- [ ] コンポーネントライブラリの整備
- [ ] アイコンシステムの統一

### Phase 2: レスポンシブデザインの改善
- [ ] モバイルファーストの実装
- [ ] タブレット対応の最適化
- [ ] デスクトップレイアウトの改善
- [ ] 画面サイズ別のテスト

### Phase 3: アクセシビリティ対応
- [ ] WCAG 2.1 AA基準への対応
- [ ] キーボードナビゲーションの実装
- [ ] スクリーンリーダー対応
- [ ] 色覚異常への配慮

## 技術的詳細

### デザインシステム
```typescript
// src/styles/design-system.ts
export const colors = {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    900: '#0c4a6e'
  },
  secondary: {
    50: '#fdf2f8',
    100: '#fce7f3',
    500: '#ec4899',
    600: '#db2777',
    700: '#be185d',
    900: '#831843'
  },
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a'
  },
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d'
  },
  warning: {
    50: '#fffbeb',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309'
  },
  error: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c'
  }
};

export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace']
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }]
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700'
  }
};

export const spacing = {
  0: '0px',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
  24: '6rem'
};
```

### アクセシブルなコンポーネント
```typescript
// src/components/ui/Button.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // ベーススタイル
          'inline-flex items-center justify-center rounded-md font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          
          // バリアント
          {
            'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500': variant === 'primary',
            'bg-secondary-600 text-white hover:bg-secondary-700 focus-visible:ring-secondary-500': variant === 'secondary',
            'border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50 focus-visible:ring-neutral-500': variant === 'outline',
            'text-neutral-900 hover:bg-neutral-100 focus-visible:ring-neutral-500': variant === 'ghost'
          },
          
          // サイズ
          {
            'h-8 px-3 text-sm': size === 'sm',
            'h-10 px-4 text-base': size === 'md',
            'h-12 px-6 text-lg': size === 'lg'
          },
          
          className
        )}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
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
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

### アクセシブルなフォーム
```typescript
// src/components/ui/Input.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;
    
    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-neutral-700"
          >
            {label}
            {props.required && (
              <span className="ml-1 text-error-500" aria-label="必須">
                *
              </span>
            )}
          </label>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'block w-full rounded-md border border-neutral-300 px-3 py-2',
            'text-neutral-900 placeholder-neutral-400',
            'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500',
            'disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-500',
            error && 'border-error-500 focus:border-error-500 focus:ring-error-500',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={cn(
            error && errorId,
            helperText && helperId
          )}
          {...props}
        />
        
        {helperText && !error && (
          <p id={helperId} className="text-sm text-neutral-600">
            {helperText}
          </p>
        )}
        
        {error && (
          <p id={errorId} className="text-sm text-error-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
```

### キーボードナビゲーション
```typescript
// src/hooks/useKeyboardNavigation.ts
import { useEffect, useRef } from 'react';

export const useKeyboardNavigation = (items: HTMLElement[], enabled = true) => {
  const currentIndexRef = useRef(0);
  
  useEffect(() => {
    if (!enabled || items.length === 0) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          currentIndexRef.current = (currentIndexRef.current + 1) % items.length;
          items[currentIndexRef.current]?.focus();
          break;
          
        case 'ArrowUp':
          event.preventDefault();
          currentIndexRef.current = currentIndexRef.current === 0 
            ? items.length - 1 
            : currentIndexRef.current - 1;
          items[currentIndexRef.current]?.focus();
          break;
          
        case 'Home':
          event.preventDefault();
          currentIndexRef.current = 0;
          items[0]?.focus();
          break;
          
        case 'End':
          event.preventDefault();
          currentIndexRef.current = items.length - 1;
          items[items.length - 1]?.focus();
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [items, enabled]);
  
  return currentIndexRef.current;
};
```

### レスポンシブデザイン
```css
/* src/styles/responsive.css */

/* モバイルファースト */
.container {
  @apply px-4 mx-auto;
  max-width: 100%;
}

/* タブレット */
@media (min-width: 768px) {
  .container {
    @apply px-6;
    max-width: 768px;
  }
  
  .grid-responsive {
    @apply grid-cols-2;
  }
}

/* デスクトップ */
@media (min-width: 1024px) {
  .container {
    @apply px-8;
    max-width: 1024px;
  }
  
  .grid-responsive {
    @apply grid-cols-3;
  }
}

/* 大画面 */
@media (min-width: 1280px) {
  .container {
    max-width: 1280px;
  }
  
  .grid-responsive {
    @apply grid-cols-4;
  }
}

/* 高コントラストモード対応 */
@media (prefers-contrast: high) {
  .button {
    @apply border-2 border-current;
  }
}

/* ダークモード対応 */
@media (prefers-color-scheme: dark) {
  .card {
    @apply bg-neutral-800 text-neutral-100;
  }
}

/* アニメーション無効化対応 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 実装ファイル

### 新規作成が必要なファイル
- `src/components/ui/Button.tsx` - アクセシブルなボタンコンポーネント
- `src/components/ui/Input.tsx` - アクセシブルな入力コンポーネント
- `src/components/ui/Modal.tsx` - アクセシブルなモーダルコンポーネント
- `src/components/ui/Toast.tsx` - アクセシブルな通知コンポーネント
- `src/hooks/useKeyboardNavigation.ts` - キーボードナビゲーションフック
- `src/hooks/useFocusManagement.ts` - フォーカス管理フック
- `src/styles/design-system.ts` - デザインシステム定義
- `src/styles/responsive.css` - レスポンシブスタイル

### 修正が必要なファイル
- `src/components/ChoresList.tsx` - 新しいUIコンポーネントの使用
- `src/components/ChoreForm.tsx` - アクセシブルなフォームの実装
- `src/components/PartnerInvitation.tsx` - UI/UXの改善
- `src/components/NotificationCenter.tsx` - アクセシブルな通知の実装
- `src/app/globals.css` - デザインシステムの適用
- `tailwind.config.js` - デザインシステムの統合

## UI/UX改善項目

### ユーザビリティ
- [ ] 直感的なナビゲーション
- [ ] 明確なCTA（Call to Action）
- [ ] 一貫したインタラクション
- [ ] 適切なフィードバック

### 視覚デザイン
- [ ] 統一されたカラーパレット
- [ ] 読みやすいタイポグラフィ
- [ ] 適切な余白とレイアウト
- [ ] 魅力的なアイコンとイラスト

### パフォーマンス
- [ ] 高速なページ読み込み
- [ ] スムーズなアニメーション
- [ ] 効率的な画像最適化
- [ ] 軽量なCSS/JS

## アクセシビリティ対応項目

### WCAG 2.1 AA基準
- [ ] 知覚可能性（Perceivable）
  - [ ] 代替テキストの提供
  - [ ] 色のコントラスト比 4.5:1以上
  - [ ] テキストの拡大（200%まで）
  - [ ] 音声・動画の字幕

- [ ] 操作可能性（Operable）
  - [ ] キーボードアクセシビリティ
  - [ ] フォーカス管理
  - [ ] 十分な時間の提供
  - [ ] 発作を引き起こさない設計

- [ ] 理解可能性（Understandable）
  - [ ] 読みやすいテキスト
  - [ ] 予測可能な機能
  - [ ] 入力支援
  - [ ] エラーの特定と修正

- [ ] 堅牢性（Robust）
  - [ ] 支援技術との互換性
  - [ ] 有効なHTML
  - [ ] 適切なARIA属性

### スクリーンリーダー対応
```typescript
// ARIAラベルとロールの適切な使用
<main role="main" aria-label="家事管理">
  <section aria-labelledby="chores-heading">
    <h2 id="chores-heading">家事一覧</h2>
    <ul role="list" aria-label="家事リスト">
      {chores.map(chore => (
        <li key={chore.id} role="listitem">
          <article aria-labelledby={`chore-${chore.id}`}>
            <h3 id={`chore-${chore.id}`}>{chore.title}</h3>
            <button
              aria-describedby={`chore-${chore.id}-status`}
              aria-pressed={chore.done}
            >
              {chore.done ? '完了を取り消す' : '完了にする'}
            </button>
            <span id={`chore-${chore.id}-status`} aria-live="polite">
              {chore.done ? '完了済み' : '未完了'}
            </span>
          </article>
        </li>
      ))}
    </ul>
  </section>
</main>
```

## テスト要件

### アクセシビリティテスト
- [ ] axe-coreを使用した自動テスト
- [ ] キーボードナビゲーションテスト
- [ ] スクリーンリーダーテスト
- [ ] 色覚異常シミュレーションテスト

### レスポンシブテスト
- [ ] 各ブレークポイントでの表示確認
- [ ] タッチデバイスでの操作確認
- [ ] 画面回転時の動作確認
- [ ] 異なる解像度での表示確認

### ユーザビリティテスト
- [ ] タスク完了率の測定
- [ ] エラー発生率の測定
- [ ] ユーザー満足度の調査
- [ ] 学習容易性の評価

## ツールと設定

### アクセシビリティ検証ツール
```json
// package.json
{
  "devDependencies": {
    "@axe-core/playwright": "^4.8.0",
    "eslint-plugin-jsx-a11y": "^6.8.0",
    "@storybook/addon-a11y": "^7.6.0"
  }
}
```

### ESLintアクセシビリティ設定
```json
// .eslintrc.json
{
  "extends": [
    "plugin:jsx-a11y/recommended"
  ],
  "rules": {
    "jsx-a11y/alt-text": "error",
    "jsx-a11y/aria-props": "error",
    "jsx-a11y/aria-proptypes": "error",
    "jsx-a11y/aria-unsupported-elements": "error",
    "jsx-a11y/role-has-required-aria-props": "error",
    "jsx-a11y/role-supports-aria-props": "error"
  }
}
```

## 依存関係

### 前提条件
- 基本的なコンポーネントが実装されていること
- デザインシステムの方針が決定されていること

### 後続タスク
- ユーザビリティテストの実施
- パフォーマンス最適化
- SEO対応

## 優先度

**Medium** - ユーザー体験向上のため重要

## 見積もり

**工数**: 3-4日
**複雑度**: Medium（デザインシステム、アクセシビリティ対応）

## 受け入れ基準

- [ ] WCAG 2.1 AA基準を満たす
- [ ] 全ての主要機能がキーボードで操作可能
- [ ] スクリーンリーダーで適切に読み上げられる
- [ ] レスポンシブデザインが正しく動作する
- [ ] デザインシステムが一貫して適用されている
- [ ] アクセシビリティテストが通る

## パフォーマンス目標

- [ ] Lighthouse Accessibility Score: 95+
- [ ] 色のコントラスト比: 4.5:1以上
- [ ] キーボードナビゲーション: 全機能対応
- [ ] スクリーンリーダー対応: 100%

## ラベル

`ui-ux`, `accessibility`, `design-system`, `responsive`, `enhancement`

---

**作成日**: 2024年12月
**担当者**: 未割り当て
**マイルストーン**: MVP リリース前