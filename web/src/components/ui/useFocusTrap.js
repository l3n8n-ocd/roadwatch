import { useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Keeps keyboard focus inside `ref` while `active` (modal dialogs, the mobile drawer).
// Moves focus in on open, calls onEscape on Escape, and gives focus back to the element that
// had it before (usually the trigger) on close.
export default function useFocusTrap(ref, active, onEscape) {
  const onEscapeRef = useRef(onEscape);
  useEffect(() => {
    onEscapeRef.current = onEscape;
  });

  useEffect(() => {
    if (!active || !ref.current) return undefined;
    const container = ref.current;
    const previous = document.activeElement;

    const focusables = () => Array.from(container.querySelectorAll(FOCUSABLE));
    // Focus the element marked data-autofocus, else the first focusable, else the container.
    const first = container.querySelector('[data-autofocus]') || focusables()[0] || container;
    first.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onEscapeRef.current?.();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    };

    container.addEventListener('keydown', onKeyDown);
    return () => {
      container.removeEventListener('keydown', onKeyDown);
      if (previous && typeof previous.focus === 'function') previous.focus();
    };
  }, [ref, active]);
}
