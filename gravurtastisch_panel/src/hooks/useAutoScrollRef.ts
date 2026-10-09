import { useRef, useEffect, useCallback } from 'react';

export function useAutoScrollRef<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  const applyScrollLogic = useCallback(() => {
    const el = ref.current;

    if (!el) return;

    const viewportWidth = window.innerWidth;

    // Mobile: let it behave naturally
    if (viewportWidth < 400) {
      el.style.height = '';
      el.style.maxHeight = '';
      el.style.overflowY = '';
      return;
    }

    const rect = el.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // Always compute available height from top
    const buffer = 10;
    const availableHeight = Math.floor(viewportHeight - rect.top - buffer);

    // Avoid negative / too small height
    const safeHeight = Math.max(availableHeight, 120);

    // Always apply height and maxHeight to dock to bottom
    el.style.height = `${safeHeight}px`;
    el.style.maxHeight = `${safeHeight}px`;
  }, []);

  useEffect(() => {
    const el = ref.current;

    if (!el) return;

    // Apply immediately
    applyScrollLogic();

    // Re-apply on viewport resize
    window.addEventListener('resize', applyScrollLogic);

    // ResizeObserver: catches when layout changes move the element (sometimes)
    const ro = new ResizeObserver(() => {
      applyScrollLogic();
    });

    ro.observe(el);

    return () => {
      window.removeEventListener('resize', applyScrollLogic);
      ro.disconnect();
    };
  }, [applyScrollLogic]);

  return ref;
}
