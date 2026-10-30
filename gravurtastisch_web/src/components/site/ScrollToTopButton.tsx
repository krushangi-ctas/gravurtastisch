import { useEffect, useState, useCallback } from "react";
import { ArrowUp } from "lucide-react";

export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll =
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;
      setVisible(currentScroll > 200);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    // Also attach to lenis scroll event if initialized
    let lenisTimer: any = null;
    const attachLenis = () => {
      const lenis = (window as any).__lenis;
      if (lenis && typeof lenis.on === "function") {
        lenis.on("scroll", handleScroll);
      } else {
        lenisTimer = setTimeout(attachLenis, 200);
      }
    };
    attachLenis();

    handleScroll();

    return () => {
      if (lenisTimer) clearTimeout(lenisTimer);
      window.removeEventListener("scroll", handleScroll);
      const lenis = (window as any).__lenis;
      if (lenis && typeof lenis.off === "function") {
        lenis.off("scroll", handleScroll);
      }
    };
  }, []);

  const scrollToTop = useCallback((e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const lenis = (window as any).__lenis;
    if (lenis && typeof lenis.scrollTo === "function") {
      lenis.scrollTo(0, { immediate: false, duration: 1.1 });
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }

    try {
      document.documentElement.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    } catch {}
  }, []);

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className={`fixed bottom-6 right-6 z-50 h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-[#0032ab] text-white shadow-[0_8px_24px_rgba(0,50,171,0.35)] hover:shadow-[0_12px_32px_rgba(0,50,171,0.5)] hover:bg-[#002685] hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center border-2 border-white/40 cursor-pointer select-none ${
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <ArrowUp className="h-5 w-5 stroke-[2.3] pointer-events-none" />
    </button>
  );
}

export default ScrollToTopButton;
