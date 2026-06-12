"use client";

import { ArrowUpIcon } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";

/**
 * Floating back-to-top button that fades in once the user scrolls
 * past the hero. Scrolling uses the page's smooth scroll-behavior,
 * which globals.css disables under prefers-reduced-motion.
 */
export function BackToTop() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() =>
        setVisible(window.scrollY > window.innerHeight * 0.9)
      );
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0 })}
      aria-label="Back to top"
      tabIndex={visible ? 0 : -1}
      className={cn(
        "fixed bottom-[4.25rem] right-4 z-40 flex size-10 items-center justify-center rounded-full border border-brand/40 bg-card/80 text-brand shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-brand hover:bg-brand/10 print:hidden xl:bottom-10 xl:right-5",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0"
      )}
    >
      <ArrowUpIcon className="size-4" aria-hidden="true" />
    </button>
  );
}
