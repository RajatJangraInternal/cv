"use client";

import React from "react";

interface RevealProps {
  children: React.ReactNode;
  /** Stagger delay in ms applied once the element enters the viewport. */
  delay?: number;
}

/**
 * Fades content up as it scrolls into view. The hidden initial state is
 * gated on `html.js` (set pre-paint in layout), so content stays visible
 * without JavaScript, in print, and for reduced-motion users.
 */
export function Reveal({ children, delay = 0 }: RevealProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is-visible");
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-visible");
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="reveal"
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
