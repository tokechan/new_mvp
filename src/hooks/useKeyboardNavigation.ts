/**
 * キーボードナビゲーション用のカスタムフック
 * アクセシビリティ対応のキーボード操作を提供
 */

import { useEffect, useRef, useCallback } from 'react';
import { getFocusableElements } from '@/lib/utils';

interface UseKeyboardNavigationOptions {
  /** 有効/無効の切り替え */
  enabled?: boolean;
  /** 循環ナビゲーションを有効にするか */
  loop?: boolean;
  /** Escapeキーでの終了を有効にするか */
  escapeToClose?: boolean;
  /** Escapeキーが押された時のコールバック */
  onEscape?: () => void;
  /** Enterキーが押された時のコールバック */
  onEnter?: (element: HTMLElement) => void;
  /** フォーカスが変更された時のコールバック */
  onFocusChange?: (element: HTMLElement, index: number) => void;
}

/**
 * キーボードナビゲーションフック
 * @param options - オプション設定
 * @returns コンテナ要素のref
 */
export function useKeyboardNavigation(options: UseKeyboardNavigationOptions = {}) {
  const {
    enabled = true,
    loop = true,
    escapeToClose = false,
    onEscape,
    onEnter,
    onFocusChange
  } = options;

  const containerRef = useRef<HTMLElement>(null);
  const currentFocusIndex = useRef<number>(-1);

  /**
   * フォーカス可能な要素を取得
   */
  const getFocusableElementsInContainer = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];
    return getFocusableElements(containerRef.current);
  }, []);

  /**
   * 指定されたインデックスの要素にフォーカスを設定
   */
  const focusElementAtIndex = useCallback((index: number) => {
    const elements = getFocusableElementsInContainer();
    if (elements.length === 0) return;

    let targetIndex = index;
    
    // 循環ナビゲーションの処理
    if (loop) {
      if (targetIndex < 0) {
        targetIndex = elements.length - 1;
      } else if (targetIndex >= elements.length) {
        targetIndex = 0;
      }
    } else {
      // 循環しない場合は範囲内に制限
      targetIndex = Math.max(0, Math.min(targetIndex, elements.length - 1));
    }

    const targetElement = elements[targetIndex];
    if (targetElement) {
      targetElement.focus();
      currentFocusIndex.current = targetIndex;
      onFocusChange?.(targetElement, targetIndex);
    }
  }, [getFocusableElementsInContainer, loop, onFocusChange]);

  /**
   * 次の要素にフォーカス
   */
  const focusNext = useCallback(() => {
    focusElementAtIndex(currentFocusIndex.current + 1);
  }, [focusElementAtIndex]);

  /**
   * 前の要素にフォーカス
   */
  const focusPrevious = useCallback(() => {
    focusElementAtIndex(currentFocusIndex.current - 1);
  }, [focusElementAtIndex]);

  /**
   * 最初の要素にフォーカス
   */
  const focusFirst = useCallback(() => {
    focusElementAtIndex(0);
  }, [focusElementAtIndex]);

  /**
   * 最後の要素にフォーカス
   */
  const focusLast = useCallback(() => {
    const elements = getFocusableElementsInContainer();
    focusElementAtIndex(elements.length - 1);
  }, [focusElementAtIndex, getFocusableElementsInContainer]);

  /**
   * 現在フォーカスされている要素のインデックスを更新
   */
  const updateCurrentFocusIndex = useCallback(() => {
    if (!containerRef.current) return;
    
    const elements = getFocusableElementsInContainer();
    const activeElement = document.activeElement as HTMLElement;
    
    const index = elements.findIndex(element => element === activeElement);
    currentFocusIndex.current = index;
  }, [getFocusableElementsInContainer]);

  /**
   * キーボードイベントハンドラ
   */
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled || !containerRef.current) return;

    // コンテナ内の要素がフォーカスされているかチェック
    const activeElement = document.activeElement as HTMLElement;
    if (!containerRef.current.contains(activeElement)) return;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        updateCurrentFocusIndex();
        focusNext();
        break;

      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        updateCurrentFocusIndex();
        focusPrevious();
        break;

      case 'Home':
        event.preventDefault();
        focusFirst();
        break;

      case 'End':
        event.preventDefault();
        focusLast();
        break;

      case 'Enter':
        if (onEnter) {
          event.preventDefault();
          onEnter(activeElement);
        }
        break;

      case 'Escape':
        if (escapeToClose && onEscape) {
          event.preventDefault();
          onEscape();
        }
        break;
    }
  }, [enabled, updateCurrentFocusIndex, focusNext, focusPrevious, focusFirst, focusLast, onEnter, escapeToClose, onEscape]);

  /**
   * フォーカスイベントハンドラ
   */
  const handleFocus = useCallback((event: FocusEvent) => {
    if (!enabled || !containerRef.current) return;
    
    const target = event.target as HTMLElement;
    if (containerRef.current.contains(target)) {
      updateCurrentFocusIndex();
    }
  }, [enabled, updateCurrentFocusIndex]);

  // イベントリスナーの設定
  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', handleFocus);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', handleFocus);
    };
  }, [enabled, handleKeyDown, handleFocus]);

  return {
    containerRef,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
    focusElementAtIndex,
    getFocusableElements: getFocusableElementsInContainer,
    currentFocusIndex: currentFocusIndex.current
  };
}

/**
 * フォーカストラップ用のフック
 * モーダルやドロワーなどでフォーカスを内部に閉じ込める
 */
export function useFocusTrap(enabled: boolean = true) {
  const containerRef = useRef<HTMLElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  /**
   * フォーカストラップを有効化
   */
  const enableTrap = useCallback(() => {
    if (!containerRef.current) return;

    // 現在のアクティブ要素を保存
    previousActiveElement.current = document.activeElement as HTMLElement;

    // コンテナ内の最初のフォーカス可能要素にフォーカス
    const focusableElements = getFocusableElements(containerRef.current);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }, []);

  /**
   * フォーカストラップを無効化
   */
  const disableTrap = useCallback(() => {
    // 以前のアクティブ要素にフォーカスを戻す
    if (previousActiveElement.current) {
      previousActiveElement.current.focus();
      previousActiveElement.current = null;
    }
  }, []);

  /**
   * Tabキーのハンドリング
   */
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled || !containerRef.current || event.key !== 'Tab') return;

    const focusableElements = getFocusableElements(containerRef.current);
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement;

    if (event.shiftKey) {
      // Shift + Tab: 逆方向
      if (activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab: 順方向
      if (activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }, [enabled]);

  // イベントリスナーの設定
  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  // 有効/無効の切り替え
  useEffect(() => {
    if (enabled) {
      enableTrap();
    } else {
      disableTrap();
    }

    return () => {
      if (enabled) {
        disableTrap();
      }
    };
  }, [enabled, enableTrap, disableTrap]);

  return {
    containerRef,
    enableTrap,
    disableTrap
  };
}

/**
 * 外部クリック検知フック
 * モーダルやドロップダウンの外部クリックで閉じる機能
 */
export function useClickOutside(
  callback: () => void,
  enabled: boolean = true
) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [callback, enabled]);

  return ref;
}