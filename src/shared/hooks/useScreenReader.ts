import { useEffect, useRef, useCallback } from 'react';

/**
 * スクリーンリーダー対応のためのカスタムフック
 * ARIA属性の管理とライブリージョンでの通知を提供
 */
export interface UseScreenReaderOptions {
  /** ライブリージョンのタイプ */
  politeness?: 'polite' | 'assertive' | 'off';
  /** 自動的にライブリージョンを作成するかどうか */
  autoCreateLiveRegion?: boolean;
}

export const useScreenReader = (options: UseScreenReaderOptions = {}) => {
  const {
    politeness = 'polite',
    autoCreateLiveRegion = true
  } = options;

  const liveRegionRef = useRef<HTMLDivElement | null>(null);
  const announcementTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * ライブリージョンを作成または取得
   */
  const getLiveRegion = useCallback(() => {
    if (liveRegionRef.current) {
      return liveRegionRef.current;
    }

    // 既存のライブリージョンを検索
    const existingRegion = document.querySelector(`[aria-live="${politeness}"][data-screen-reader-region]`);
    if (existingRegion) {
      liveRegionRef.current = existingRegion as HTMLDivElement;
      return liveRegionRef.current;
    }

    // 新しいライブリージョンを作成
    if (autoCreateLiveRegion) {
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', politeness);
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.setAttribute('data-screen-reader-region', 'true');
      liveRegion.style.position = 'absolute';
      liveRegion.style.left = '-10000px';
      liveRegion.style.width = '1px';
      liveRegion.style.height = '1px';
      liveRegion.style.overflow = 'hidden';
      
      document.body.appendChild(liveRegion);
      liveRegionRef.current = liveRegion;
      return liveRegion;
    }

    return null;
  }, [politeness, autoCreateLiveRegion]);

  /**
   * スクリーンリーダーにメッセージを通知
   */
  const announce = useCallback((message: string, immediate = false) => {
    const liveRegion = getLiveRegion();
    if (!liveRegion) return;

    // 既存のタイムアウトをクリア
    if (announcementTimeoutRef.current) {
      clearTimeout(announcementTimeoutRef.current);
    }

    if (immediate) {
      liveRegion.textContent = message;
    } else {
      // 少し遅延させてスクリーンリーダーが確実に読み上げるようにする
      announcementTimeoutRef.current = setTimeout(() => {
        liveRegion.textContent = message;
        
        // メッセージをクリアするタイムアウトを設定
        announcementTimeoutRef.current = setTimeout(() => {
          liveRegion.textContent = '';
        }, 1000);
      }, 100);
    }
  }, [getLiveRegion]);

  /**
   * 要素にARIA属性を設定するヘルパー関数
   */
  const setAriaAttributes = useCallback((element: HTMLElement, attributes: Record<string, string>) => {
    Object.entries(attributes).forEach(([key, value]) => {
      if (key.startsWith('aria-') || key.startsWith('role')) {
        element.setAttribute(key, value);
      }
    });
  }, []);

  /**
   * 要素のARIA属性を削除するヘルパー関数
   */
  const removeAriaAttributes = useCallback((element: HTMLElement, attributes: string[]) => {
    attributes.forEach(attr => {
      if (attr.startsWith('aria-') || attr.startsWith('role')) {
        element.removeAttribute(attr);
      }
    });
  }, []);

  /**
   * 要素にアクセシブルな名前を設定
   */
  const setAccessibleName = useCallback((element: HTMLElement, name: string, method: 'label' | 'labelledby' | 'describedby' = 'label') => {
    switch (method) {
      case 'label':
        element.setAttribute('aria-label', name);
        break;
      case 'labelledby':
        // ラベル要素のIDを設定（呼び出し側で適切なIDを渡す必要がある）
        element.setAttribute('aria-labelledby', name);
        break;
      case 'describedby':
        // 説明要素のIDを設定（呼び出し側で適切なIDを渡す必要がある）
        element.setAttribute('aria-describedby', name);
        break;
    }
  }, []);

  /**
   * 要素の状態をスクリーンリーダーに通知
   */
  const announceState = useCallback((element: HTMLElement, state: string) => {
    const elementName = element.getAttribute('aria-label') || 
                       element.getAttribute('title') || 
                       element.textContent || 
                       '要素';
    announce(`${elementName}が${state}になりました`);
  }, [announce]);

  /**
   * フォームエラーをスクリーンリーダーに通知
   */
  const announceFormError = useCallback((fieldName: string, errorMessage: string) => {
    announce(`${fieldName}にエラーがあります: ${errorMessage}`, true);
  }, [announce]);

  /**
   * 成功メッセージをスクリーンリーダーに通知
   */
  const announceSuccess = useCallback((message: string) => {
    announce(`成功: ${message}`);
  }, [announce]);

  /**
   * 警告メッセージをスクリーンリーダーに通知
   */
  const announceWarning = useCallback((message: string) => {
    announce(`警告: ${message}`);
  }, [announce]);

  /**
   * エラーメッセージをスクリーンリーダーに通知
   */
  const announceError = useCallback((message: string) => {
    announce(`エラー: ${message}`, true);
  }, [announce]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (announcementTimeoutRef.current) {
        clearTimeout(announcementTimeoutRef.current);
      }
      
      // 自動作成したライブリージョンを削除
      if (autoCreateLiveRegion && liveRegionRef.current && liveRegionRef.current.parentNode) {
        liveRegionRef.current.parentNode.removeChild(liveRegionRef.current);
      }
    };
  }, [autoCreateLiveRegion]);

  return {
    announce,
    announceState,
    announceFormError,
    announceSuccess,
    announceWarning,
    announceError,
    setAriaAttributes,
    removeAriaAttributes,
    setAccessibleName,
    liveRegionRef
  };
};

/**
 * フォーカス管理用のカスタムフック
 * フォーカスの移動とトラップを管理
 */
export const useFocusManagement = () => {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  /**
   * 現在のフォーカスを保存
   */
  const saveFocus = useCallback(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
  }, []);

  /**
   * 保存されたフォーカスを復元
   */
  const restoreFocus = useCallback(() => {
    if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
      previousFocusRef.current.focus();
    }
  }, []);

  /**
   * 指定された要素にフォーカスを設定
   */
  const setFocus = useCallback((element: HTMLElement | null, options?: FocusOptions) => {
    if (element && typeof element.focus === 'function') {
      element.focus(options);
    }
  }, []);

  /**
   * 要素内の最初のフォーカス可能な要素にフォーカス
   */
  const focusFirstElement = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }, []);

  /**
   * 要素内の最後のフォーカス可能な要素にフォーカス
   */
  const focusLastElement = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus();
    }
  }, []);

  return {
    saveFocus,
    restoreFocus,
    setFocus,
    focusFirstElement,
    focusLastElement
  };
};