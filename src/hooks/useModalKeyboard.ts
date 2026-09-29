import { useEffect, useRef } from 'react';

interface UseModalKeyboardOptions {
  isOpen: boolean;
  onClose?: () => void;
  disableEscape?: boolean;
  disableTabTrap?: boolean;
}

/**
 * Reusable hook providing complete accessibility keyboard navigation for modals:
 * - Escape key presses close the active modal.
 * - Tab and Shift+Tab cycle focus strictly within the focusable elements of the modal.
 * - Automatically moves focus to the first focusable element upon opening.
 * - Restores focus to the previously active element upon closing.
 */
export function useModalKeyboard<T extends HTMLElement = HTMLDivElement>({
  isOpen,
  onClose,
  disableEscape = false,
  disableTabTrap = false,
}: UseModalKeyboardOptions) {
  const modalRef = useRef<T>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Remember previous active element to restore focus on close
    previousActiveElement.current = document.activeElement as HTMLElement | null;

    // Move initial focus into modal
    const focusTimer = setTimeout(() => {
      if (modalRef.current) {
        const focusableSelector =
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
        const focusableElements = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(focusableSelector)
        ).filter((el) => {
          return el.offsetParent !== null || el.getClientRects().length > 0;
        });

        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        } else {
          modalRef.current.focus?.();
        }
      }
    }, 40);

    const handleKeyDown = (event: KeyboardEvent) => {
      // 1. ESC to close
      if (event.key === 'Escape' && !disableEscape && onClose) {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }

      // 2. Tab to cycle focus within modal
      if (event.key === 'Tab' && !disableTabTrap && modalRef.current) {
        const focusableSelector =
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
        const focusables = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(focusableSelector)
        ).filter((el) => el.offsetParent !== null || el.getClientRects().length > 0);

        if (focusables.length === 0) {
          event.preventDefault();
          return;
        }

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (event.shiftKey) {
          // Shift + Tab: backwards
          if (
            document.activeElement === firstElement ||
            !modalRef.current.contains(document.activeElement)
          ) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab: forwards
          if (
            document.activeElement === lastElement ||
            !modalRef.current.contains(document.activeElement)
          ) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown, true);
      if (previousActiveElement.current && typeof previousActiveElement.current.focus === 'function') {
        try {
          previousActiveElement.current.focus();
        } catch {
          // ignore focus error
        }
      }
    };
  }, [isOpen, onClose, disableEscape, disableTabTrap]);

  return modalRef;
}
