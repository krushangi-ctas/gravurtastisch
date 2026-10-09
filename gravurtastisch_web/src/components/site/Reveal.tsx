import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Premium scroll-triggered reveal component with smooth animation duration & stagger.
 * Elements slide and fade into view with a natural easing curve as the user scrolls.
 */
export function Reveal<T extends React.ElementType = "div">({
  children,
  delay = 0,
  className = "",
  as,
}: React.PropsWithChildren<{
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: React.ElementType;
}>): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Accessibility check: show immediately if user prefers reduced motion
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }

    // Helper: Check if element is already within the visible viewport on mount
    const checkInView = () => {
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 800;
      // Show immediately only if already inside the current screen view
      const inView = rect.top < viewportHeight - 20 && rect.bottom > 0;
      if (inView) {
        setShown(true);
        return true;
      }
      return false;
    };

    // 1. Check if already visible on mount
    requestAnimationFrame(() => {
      if (checkInView()) return;
    });

    // 2. IntersectionObserver for smooth scroll-driven entrance
    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              setShown(true);
              if (observer && el) {
                observer.unobserve(el);
                observer.disconnect();
              }
              break;
            }
          }
        },
        {
          root: null,
          rootMargin: "0px 0px -40px 0px", // triggers cleanly when scrolled 40px into view
          threshold: 0.08,
        }
      );
      observer.observe(el);
    } else {
      setShown(true);
    }

    // 3. Fallback scroll/resize listener
    const onScrollOrResize = () => {
      if (checkInView()) {
        window.removeEventListener("scroll", onScrollOrResize);
        window.removeEventListener("resize", onScrollOrResize);
      }
    };
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });

    // 4. Safety timer: ensure content is never permanently hidden
    const safetyTimer = setTimeout(() => {
      setShown(true);
    }, 2500);

    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      clearTimeout(safetyTimer);
    };
  }, []);

  const Comp = as || "div";
  const effectiveDelay = Math.min(delay, 350);

  return (
    <Comp
      ref={ref}
      className={`transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${
        shown ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-[0.99]"
      } ${className}`}
      style={{
        transitionDelay: shown ? `${effectiveDelay}ms` : "0ms",
      }}
    >
      {children}
    </Comp>
  );
}