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

    // High-performance IntersectionObserver for entrance animations without forced reflow
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
          threshold: 0.05,
        }
      );
      observer.observe(el);
    } else {
      setShown(true);
    }

    // Safety timer: ensure content is always visible even in extreme throttling
    const safetyTimer = setTimeout(() => {
      setShown(true);
    }, 1500);

    return () => {
      if (observer) observer.disconnect();
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